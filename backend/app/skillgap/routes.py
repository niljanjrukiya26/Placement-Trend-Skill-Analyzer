"""
Skill Gap Analysis API Routes
Handles skill gap analysis and AI-powered action plan generation
"""
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pymongo.errors import PyMongoError
from bson.objectid import ObjectId
from app.utils import error_response, success_response
from app.branch_utils import normalize_branch_name
from app.skillgap.services import generate_action_plan, calculate_readiness_level

skillgap_bp = Blueprint('skillgap', __name__, url_prefix='/api/skillgap')


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
        
        # Find student by userid
        student = db.students.find_one({'userid': user_id})
        
        if not student:
            return error_response('Student profile not found', 404)
        
        student_id = student.get('student_id')
        
        # Redirect to main analysis function
        return get_skill_gap_analysis(student_id)
    
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)
