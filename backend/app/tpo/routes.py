"""
TPO (Training and Placement Officer) API Routes
Handles TPO profile and placement management
"""
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pymongo.errors import PyMongoError
from app.utils import error_response, success_response, role_required

tpo_bp = Blueprint('tpo', __name__, url_prefix='/api/tpo')

@tpo_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_tpo_profile():
    """
    Get TPO profile information
    Returns: TPO name and assigned branch
    Requires: JWT token (TPO role)
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        # Verify user is TPO
        if claims.get('role') != 'TPO':
            return error_response('Only TPO can access TPO profile', 403)
        
        db = current_app.mongo_db
        
        # Find TPO record by userid
        tpo = db.tpo.find_one({'userid': user_id})
        
        if not tpo:
            return error_response('TPO profile not found', 404)
        
        # Clean response
        tpo_data = {
            'userid': tpo.get('userid'),
            'tpo_id': tpo.get('tpo_id'),
            'tpo_name': tpo.get('tpo_name'),
            'branch': tpo.get('branch')
        }
        
        return success_response(tpo_data, 'TPO profile retrieved', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)

@tpo_bp.route('/students', methods=['GET'])
@jwt_required()
def get_branch_students():
    """
    Get all students in TPO's branch
    Returns: List of students with their academic details
    Requires: JWT token (TPO role)
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        if claims.get('role') != 'TPO':
            return error_response('Only TPO can access this resource', 403)
        
        db = current_app.mongo_db
        
        # Find TPO info to get branch
        tpo = db.tpo.find_one({'userid': user_id})
        if not tpo:
            return error_response('TPO profile not found', 404)
        
        branch = tpo.get('branch')
        
        # Find all students in the branch
        students = list(db.students.find(
            {'branch': branch},
            {'_id': 0}
        ))
        
        return success_response(students, f'Students from {branch} retrieved', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)

@tpo_bp.route('/placement-records', methods=['GET'])
@jwt_required()
def get_placement_records():
    """
    Get placement records for TPO's branch
    Query Parameters:
        - year: Filter by specific year (optional)
    Returns: List of placement records
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        if claims.get('role') != 'TPO':
            return error_response('Only TPO can access this resource', 403)
        
        year = request.args.get('year', type=int)
        db = current_app.mongo_db
        
        # Get TPO branch
        tpo = db.tpo.find_one({'userid': user_id})
        if not tpo:
            return error_response('TPO profile not found', 404)
        
        branch = tpo.get('branch')
        
        # Build query
        query = {'branch': branch}
        if year:
            query['placement_year'] = year
        
        # Find placement records
        records = list(db.placement_records.find(query, {'_id': 0}))
        
        return success_response(records, 'Placement records retrieved', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)

@tpo_bp.route('/branch-statistics', methods=['GET'])
@jwt_required()
def get_branch_statistics():
    """
    Get comprehensive placement statistics for TPO's branch
    Returns:
        - Total students in branch
        - Total placed students
        - Placement percentage
        - Top companies recruiting
        - Average package
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        if claims.get('role') != 'TPO':
            return error_response('Only TPO can access this resource', 403)
        
        db = current_app.mongo_db
        
        # Get TPO branch
        tpo = db.tpo.find_one({'userid': user_id})
        if not tpo:
            return error_response('TPO profile not found', 404)
        
        branch = tpo.get('branch')
        
        # Get total students
        total_students = db.students.count_documents({'branch': branch})
        
        # Get placement statistics
        placement_stats = list(db.placement_records.aggregate([
            {'$match': {'branch': branch}},
            {
                '$group': {
                    '_id': None,
                    'total': {'$sum': 1},
                    'placed': {
                        '$sum': {'$cond': [{'$eq': ['$placed_status', True]}, 1, 0]}
                    },
                    'avg_package': {
                        '$avg': {
                            '$cond': [
                                {'$eq': ['$placed_status', True]},
                                '$package_lpa',
                                None
                            ]
                        }
                    }
                }
            }
        ]))
        
        if placement_stats:
            stats = placement_stats[0]
            placed = stats['placed']
            total = stats['total']
            avg_package = stats.get('avg_package', 0)
            
            percentage = (placed / total * 100) if total > 0 else 0
        else:
            placed = 0
            total = 0
            percentage = 0
            avg_package = 0
        
        # Top companies
        top_companies = list(db.placement_records.aggregate([
            {'$match': {'branch': branch, 'placed_status': True}},
            {'$group': {'_id': '$company_name', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 5},
            {'$project': {'_id': 0, 'company': '$_id', 'count': 1}}
        ]))
        
        result = {
            'branch': branch,
            'total_students': total_students,
            'placed_students': placed,
            'placement_records': total,
            'placement_percentage': round(percentage, 2),
            'average_package': round(avg_package, 2),
            'top_companies': top_companies
        }
        
        return success_response(result, 'Branch statistics retrieved', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)
