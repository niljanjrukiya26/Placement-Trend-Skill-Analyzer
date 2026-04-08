"""
Skill Gap Analysis API Routes
Handles skill gap analysis and AI-powered action plan generation
"""
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pymongo.errors import PyMongoError
from bson.objectid import ObjectId
from app.utils import error_response, success_response, find_student_by_identity
from app.branch_utils import normalize_branch_name
from app.skillgap.services import generate_action_plan, calculate_readiness_level

skillgap_bp = Blueprint('skillgap', __name__, url_prefix='/api/skillgap')


@skillgap_bp.route('/domain-analysis', methods=['GET'])
@jwt_required()
def get_domain_skill_gap_for_logged_in_student():
    """Domain-wise skill gap analysis for the logged-in student.

    Uses student's interested domains and technical skills to compare against
    requirements from the domain_job_roles collection.

    Response format:
        [
          {
            "domain": "Software Development",
            "job_roles": [
              {
                "job_role": "Backend Developer",
                "required_skills": ["Python", "Docker", "Linux"],
                "matched_skills": ["Python"],
                "missing_skills": ["Docker", "Linux"],
                "readiness_percentage": 33
              }
            ]
          }
        ]
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()

        if claims.get('role') != 'Student':
            return error_response('Only students can access this endpoint', 403)

        db = current_app.mongo_db

        # Find student using JWT userid with legacy fallback link styles
        student = find_student_by_identity(db, user_id)
        if not student:
            return error_response('Student profile not found', 404)

        student_branch = normalize_branch_name(student.get('branch', ''))

        # Map existing profile fields to domain analysis semantics
        interested_domains = student.get('interested_field') or []
        if isinstance(interested_domains, str):
            interested_domains = [interested_domains]
        interested_domains = [
            d.strip() for d in interested_domains
            if isinstance(d, str) and d.strip()
        ]

        technical_skills_raw = student.get('skills', []) or []
        if isinstance(technical_skills_raw, str):
            technical_skills_raw = [technical_skills_raw]
        technical_skills = {
            s.strip().lower()
            for s in technical_skills_raw
            if isinstance(s, str) and s.strip()
        }

        if not interested_domains:
            # No domains selected means nothing to analyze
            return success_response([], 'No interested domains set for student', 200)

        # Fetch domain_job_roles where domain is in student's interested domains
        # and student's branch is eligible for the role
        query = {
            'domain': {'$in': interested_domains},
            'eligible_branches': student_branch,
        }

        try:
            domain_roles_cursor = db.domain_job_roles.find(query, {'_id': 0})
            domain_roles = list(domain_roles_cursor)
        except PyMongoError as e:
            return error_response(f'Database error: {str(e)}', 500)

        # Group results by domain with detailed job role analysis
        domain_to_roles = {}

        for role in domain_roles:
            domain = role.get('domain')
            if not domain:
                continue

            job_role_name = role.get('job_role')
            required_raw = role.get('required_skills', []) or []

            # Clean required_skills list while preserving original casing
            required_skills = [
                s.strip() for s in required_raw
                if isinstance(s, str) and s.strip()
            ]
            required_lower = [s.lower() for s in required_skills]

            # Determine matched and missing skills (case-insensitive match)
            matched_skills = [
                original for original, lower_val in zip(required_skills, required_lower)
                if lower_val in technical_skills
            ]
            missing_skills = [
                original for original, lower_val in zip(required_skills, required_lower)
                if lower_val not in technical_skills
            ]

            total_required = len(required_skills)
            if total_required > 0:
                readiness_percentage = int(round((len(matched_skills) / total_required) * 100))
            else:
                readiness_percentage = 0

            role_entry = {
                'job_role': job_role_name,
                'required_skills': required_skills,
                'matched_skills': matched_skills,
                'missing_skills': missing_skills,
                'readiness_percentage': readiness_percentage,
            }

            domain_to_roles.setdefault(domain, []).append(role_entry)

        # Build response array
        response_data = [
            {
                'domain': domain,
                'job_roles': roles,
            }
            for domain, roles in domain_to_roles.items()
        ]

        return success_response(response_data, 'Domain-wise skill gap analysis completed', 200)

    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@skillgap_bp.route('/analysis/<student_id>', methods=['GET'])
@jwt_required()
def get_skill_gap_analysis(student_id):
    """
    Analyze skill gap for a specific student
    
    Compares student's technical skills with required skills for job roles
    in their branch and calculates readiness score
    
    Args:
        student_id: Student identification number
        
    Returns:
        JSON: Detailed skill gap analysis with job role comparisons
    """
    try:
        db = current_app.mongo_db
        
        # Find student by student_id
        student = db.students.find_one({'student_id': student_id})
        
        if not student:
            return error_response('Student not found', 404)
        
        student_branch = normalize_branch_name(student.get('branch', ''))
        student_skills = set(skill.strip().lower() for skill in student.get('skills', []))
        
        # Fetch all job roles eligible for student's branch
        job_roles = list(db.job_roles.find({'eligible_branches': student_branch}))
        
        if not job_roles:
            return error_response(f'No job roles found for branch: {student_branch}', 404)
        
        # Analyze each job role
        job_role_analysis = []
        all_missing_skills = set()
        total_match_percentage = 0
        
        for job_role in job_roles:
            role_name = job_role.get('job_role', '')
            required_skills = set(skill.strip().lower() for skill in job_role.get('required_skills', []))
            
            # Calculate skill match
            matched_skills = student_skills.intersection(required_skills)
            missing_skills = required_skills - student_skills
            
            # Calculate match percentage
            if len(required_skills) > 0:
                match_percentage = (len(matched_skills) / len(required_skills)) * 100
            else:
                match_percentage = 0
            
            total_match_percentage += match_percentage
            all_missing_skills.update(missing_skills)
            
            # Build job role analysis object
            job_role_analysis.append({
                'job_role': role_name,
                'match_percentage': round(match_percentage, 2),
                'matched_skills': sorted(list(matched_skills)),
                'missing_skills': sorted(list(missing_skills)),
                'total_required_skills': len(required_skills),
                'total_matched_skills': len(matched_skills)
            })
        
        # Sort by match percentage (highest first)
        job_role_analysis.sort(key=lambda x: x['match_percentage'], reverse=True)
        
        # Calculate overall readiness score
        if len(job_roles) > 0:
            readiness_score = round(total_match_percentage / len(job_roles), 2)
        else:
            readiness_score = 0
        
        # Determine readiness level
        readiness_level = calculate_readiness_level(readiness_score)
        
        # Prepare response
        analysis_result = {
            'student_id': student_id,
            'branch': student_branch,
            'student_skills': sorted(list(student_skills)),
            'readiness_score': readiness_score,
            'readiness_level': readiness_level,
            'total_job_roles_analyzed': len(job_roles),
            'job_role_analysis': job_role_analysis,
            'overall_missing_skills': sorted(list(all_missing_skills)),
            'top_matched_role': job_role_analysis[0] if job_role_analysis else None
        }
        
        return success_response(analysis_result, 'Skill gap analysis completed', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@skillgap_bp.route('/action-plan', methods=['POST'])
@jwt_required()
def generate_micro_action_plan():
    """
    Generate AI-powered 30-day micro action plan
    
    Uses OpenAI to create personalized learning roadmap based on
    missing skills for target job role
    
    Request Body:
        {
            "student_id": "CS101",
            "target_job_role": "Full Stack Developer"
        }
        
    Returns:
        JSON: Structured 30-day action plan with weekly goals, tasks, resources
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response('Request body is required', 400)
        
        student_id = data.get('student_id')
        target_job_role = data.get('target_job_role')
        
        if not student_id or not target_job_role:
            return error_response('student_id and target_job_role are required', 400)
        
        db = current_app.mongo_db
        
        # Fetch student
        student = db.students.find_one({'student_id': student_id})
        if not student:
            return error_response('Student not found', 404)
        
        student_branch = normalize_branch_name(student.get('branch', ''))
        student_skills = set(skill.strip().lower() for skill in student.get('skills', []))
        
        # Find target job role
        job_role = db.job_roles.find_one({
            'job_role': {'$regex': f'^{target_job_role}$', '$options': 'i'}
        })
        
        if not job_role:
            return error_response(f'Job role "{target_job_role}" not found', 404)
        
        required_skills = set(skill.strip().lower() for skill in job_role.get('required_skills', []))
        
        # Calculate missing skills
        matched_skills = student_skills.intersection(required_skills)
        missing_skills = list(required_skills - student_skills)
        
        # Calculate match percentage
        if len(required_skills) > 0:
            match_percentage = (len(matched_skills) / len(required_skills)) * 100
        else:
            match_percentage = 0
        
        # Generate AI action plan
        ai_result = generate_action_plan(target_job_role, missing_skills, student_branch)
        
        if ai_result.get('error'):
            return error_response(ai_result.get('message', 'Failed to generate action plan'), 500)
        
        # Prepare response
        response_data = {
            'student_id': student_id,
            'branch': student_branch,
            'target_job_role': target_job_role,
            'current_match_percentage': round(match_percentage, 2),
            'matched_skills': sorted(list(matched_skills)),
            'missing_skills': sorted(missing_skills),
            'action_plan': ai_result.get('action_plan'),
            'tokens_used': ai_result.get('tokens_used', 0)
        }
        
        return success_response(response_data, 'Micro action plan generated successfully', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@skillgap_bp.route('/student/analysis', methods=['GET'])
@jwt_required()
def get_logged_in_student_analysis():
    """
    Get skill gap analysis for currently logged-in student
    
    Extracts student info from JWT token and performs analysis
    
    Returns:
        JSON: Skill gap analysis for authenticated student
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        if claims.get('role') != 'Student':
            return error_response('Only students can access this endpoint', 403)
        
        db = current_app.mongo_db
        
        # Find student using JWT userid with legacy fallback link styles
        student = find_student_by_identity(db, user_id)
        
        if not student:
            return error_response('Student profile not found', 404)
        
        student_id = student.get('student_id')
        
        # Redirect to main analysis function
        return get_skill_gap_analysis(student_id)
    
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)
