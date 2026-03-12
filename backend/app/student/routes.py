"""
Student API Routes
Handles student profile and related data
"""
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pymongo.errors import PyMongoError
from bson.objectid import ObjectId
from app.utils import error_response, success_response, role_required
from app.branch_utils import normalize_branch_name

student_bp = Blueprint('student', __name__, url_prefix='/api/student')

@student_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_student_profile():
    """
    Get student profile information
    Returns: Student academic details and skills
    Requires: JWT token (Student role)
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        # Only students can view their own profile (MVP simplification)
        if claims.get('role') != 'Student':
            return error_response('Only students can access student profiles', 403)
        
        db = current_app.mongo_db
        
        # Find student record by userid
        student = db.students.find_one({'userid': user_id})
        
        if not student:
            return error_response('Student profile not found', 404)
        
        # Clean response - remove MongoDB ObjectId
        student_data = {
            'userid': student.get('userid'),
            'student_id': student.get('student_id'),
            'branch': normalize_branch_name(student.get('branch')),
            'cgpa': student.get('cgpa'),
            'backlogs': student.get('backlogs'),
            'interested_field': student.get('interested_field'),
            'skills': student.get('skills', [])
        }
        
        return success_response(student_data, 'Student profile retrieved', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)

@student_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_student_profile():
    """
    Update student profile information (Optional for MVP)
    Updates: interested_field, skills
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        if claims.get('role') != 'Student':
            return error_response('Only students can update their profile', 403)
        
        data = request.get_json()
        db = current_app.mongo_db
        
        # Prepare update data
        update_data = {}
        if 'interested_field' in data:
            update_data['interested_field'] = data.get('interested_field')
        if 'skills' in data:
            update_data['skills'] = data.get('skills')
        
        if not update_data:
            return error_response('No fields to update', 400)
        
        # Update student record
        result = db.students.update_one(
            {'userid': user_id},
            {'$set': update_data}
        )
        
        if result.modified_count == 0:
            return error_response('Student not found or no changes made', 404)
        
        return success_response({}, 'Profile updated successfully', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)

@student_bp.route('/placement-status', methods=['GET'])
@jwt_required()
def get_placement_status():
    """
    Get placement status for the logged-in student
    Returns: Placement record if exists
    """
    try:
        user_id = get_jwt_identity()
        db = current_app.mongo_db
        
        # Find student to get student_id
        student = db.students.find_one({'userid': user_id})
        if not student:
            return error_response('Student not found', 404)
        
        student_id = student.get('student_id')
        
        # Find placement record
        placement = db.placement_records.find_one({'student_id': student_id})
        
        if not placement:
            return success_response({
                'placed_status': False,
                'message': 'No placement record found'
            }, 'Placement status retrieved', 200)
        
        placement_data = {
            'student_id': placement.get('student_id'),
            'branch': normalize_branch_name(placement.get('branch')),
            'cgpa': placement.get('cgpa'),
            'backlogs': placement.get('backlogs'),
            'placement_year': placement.get('placement_year'),
            'placed_status': placement.get('placed_status'),
            'company_name': placement.get('company_name'),
            'job_role': placement.get('job_role'),
            'package_lpa': placement.get('package_lpa')
        }
        
        return success_response(placement_data, 'Placement status retrieved', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)
