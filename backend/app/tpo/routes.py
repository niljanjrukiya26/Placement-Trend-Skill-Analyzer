"""
TPO (Training and Placement Officer) API Routes
Handles TPO profile and placement management
"""
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pymongo.errors import PyMongoError
from bson import ObjectId
import pandas as pd
from uuid import uuid4
from io import StringIO
from datetime import datetime
from app.utils import error_response, success_response, role_required
from app.branch_utils import normalize_branch_name
from app.score_utils import calculate_score, update_student_score

tpo_bp = Blueprint('tpo', __name__, url_prefix='/api/tpo')


def _normalize_role(role_value):
    if not isinstance(role_value, str):
        return ''
    role = role_value.strip().upper()
    if role == 'TPO':
        return 'MAIN_TPO'
    return role


def _get_user_and_tpo_by_email(db, email):
    """Fetch user by email, then fetch tpo by userid."""
    safe_email = (email or '').strip().lower()
    if not safe_email:
        return None, None, error_response('Email query parameter is required', 400)

    user = db.users.find_one({'email': safe_email}, {'_id': 0, 'userid': 1, 'role': 1, 'email': 1})
    if not user:
        return None, None, error_response('User not found', 404)

    userid = user.get('userid')
    if not userid:
        return None, None, error_response('Invalid user record: userid missing', 400)

    tpo = db.tpo.find_one({'userid': userid}, {'_id': 0, 'userid': 1, 'tpo_id': 1, 'tpo_name': 1, 'branch': 1})
    if not tpo:
        return user, None, error_response('TPO not found', 404)

    return user, tpo, None


def _is_main_tpo_claims():
    """Check whether current JWT claims belong to MAIN_TPO."""
    claims = get_jwt() or {}
    return _normalize_role(claims.get('role')) == 'MAIN_TPO'


@tpo_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_tpos():
    """Return all TPOs with mapped user email and role (MAIN_TPO only)."""
    try:
        if not _is_main_tpo_claims():
            return error_response('Only MAIN_TPO can access this resource', 403)

        db = current_app.mongo_db
        tpo_docs = list(db.tpo.find({}, {'_id': 0, 'userid': 1, 'tpo_id': 1, 'tpo_name': 1, 'branch': 1}))

        result = []
        for doc in tpo_docs:
            user_doc = db.users.find_one({'userid': doc.get('userid')}, {'_id': 0, 'email': 1, 'role': 1}) or {}
            result.append({
                'userid': doc.get('userid'),
                'tpo_id': doc.get('tpo_id'),
                'name': doc.get('tpo_name'),
                'branch': normalize_branch_name(doc.get('branch')),
                'email': user_doc.get('email'),
                'role': _normalize_role(user_doc.get('role')),
            })

        return success_response(result, 'TPO records retrieved', 200)
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@tpo_bp.route('/add', methods=['POST'])
@jwt_required()
def add_tpo():
    """Create user + tpo documents for a new TPO (MAIN_TPO only)."""
    try:
        if not _is_main_tpo_claims():
            return error_response('Only MAIN_TPO can access this resource', 403)

        payload = request.get_json() or {}
        tpo_name = (payload.get('tpo_name') or '').strip()
        email = (payload.get('email') or '').strip().lower()
        password = payload.get('password') or ''
        branch = normalize_branch_name(payload.get('branch') or '')
        role = _normalize_role(payload.get('role'))

        if not tpo_name or not email or not password or not role:
            return error_response('tpo_name, email, password and role are required', 400)

        if role not in ['MAIN_TPO', 'BRANCH_TPO']:
            return error_response('Role must be MAIN_TPO or BRANCH_TPO', 400)

        if role == 'BRANCH_TPO' and not branch:
            return error_response('branch is required for BRANCH_TPO', 400)

        db = current_app.mongo_db

        existing = db.users.find_one({'email': email}, {'_id': 1})
        if existing:
            return error_response('User with this email already exists', 409)

        userid = f"tpo_{uuid4().hex[:10]}"
        tpo_id = f"TPO{str(db.tpo.count_documents({}) + 1).zfill(3)}"

        db.users.insert_one({
            'userid': userid,
            'email': email,
            'password': password,
            'role': role,
        })

        try:
            db.tpo.insert_one({
                'userid': userid,
                'tpo_id': tpo_id,
                'tpo_name': tpo_name,
                'branch': branch,
            })
        except Exception:
            db.users.delete_one({'userid': userid})
            raise

        return success_response({
            'userid': userid,
            'tpo_id': tpo_id,
            'name': tpo_name,
            'email': email,
            'branch': branch,
            'role': role,
        }, 'TPO created successfully', 201)
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@tpo_bp.route('/update/<userid>', methods=['PUT'])
@jwt_required()
def update_tpo(userid):
    """Update TPO name and branch (MAIN_TPO only)."""
    try:
        if not _is_main_tpo_claims():
            return error_response('Only MAIN_TPO can access this resource', 403)

        payload = request.get_json() or {}
        tpo_name = (payload.get('tpo_name') or '').strip()
        branch = normalize_branch_name(payload.get('branch') or '')
        role = _normalize_role(payload.get('role')) if payload.get('role') else None

        if not tpo_name:
            return error_response('tpo_name is required', 400)

        if role and role not in ['MAIN_TPO', 'BRANCH_TPO']:
            return error_response('Role must be MAIN_TPO or BRANCH_TPO', 400)

        if role == 'BRANCH_TPO' and not branch:
            return error_response('branch is required for BRANCH_TPO', 400)

        db = current_app.mongo_db
        tpo_updates = {'tpo_name': tpo_name, 'branch': branch}

        result = db.tpo.update_one(
            {'userid': userid},
            {'$set': tpo_updates}
        )

        if result.matched_count == 0:
            return error_response('TPO not found', 404)

        if role:
            db.users.update_one({'userid': userid}, {'$set': {'role': role}})

        return success_response({'userid': userid, 'name': tpo_name, 'branch': branch, 'role': role}, 'TPO updated successfully', 200)
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@tpo_bp.route('/delete/<userid>', methods=['DELETE'])
@jwt_required()
def delete_tpo(userid):
    """Delete user + tpo records by userid (MAIN_TPO only)."""
    try:
        if not _is_main_tpo_claims():
            return error_response('Only MAIN_TPO can access this resource', 403)

        db = current_app.mongo_db
        tpo_result = db.tpo.delete_one({'userid': userid})
        user_result = db.users.delete_one({'userid': userid})

        if tpo_result.deleted_count == 0 and user_result.deleted_count == 0:
            return error_response('TPO not found', 404)

        return success_response({'userid': userid}, 'TPO deleted successfully', 200)
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


def _resolve_user_context(db):
    """
    Resolve role and branch from request.user first, then fallback to JWT + DB lookup.
    Expected request.user shape:
    {
        "role": "MAIN_TPO" or "BRANCH_TPO",
        "branch": "Information Technology"
    }
    """
    user_payload = getattr(request, 'user', None)
    role = ''
    branch = ''

    if isinstance(user_payload, dict):
        role = _normalize_role(user_payload.get('role'))
        branch = normalize_branch_name(user_payload.get('branch'))

    claims = get_jwt() or {}
    user_identity = get_jwt_identity()

    if not role:
        role = _normalize_role(claims.get('role'))

    if not branch and role == 'BRANCH_TPO':
        tpo_doc = None

        if user_identity:
            tpo_doc = db.tpo.find_one({'userid': user_identity}, {'_id': 0, 'branch': 1})

        if not tpo_doc:
            email = claims.get('email')
            if email:
                user_doc = db.users.find_one({'email': email}, {'_id': 0, 'userid': 1})
                if user_doc and user_doc.get('userid'):
                    tpo_doc = db.tpo.find_one({'userid': user_doc.get('userid')}, {'_id': 0, 'branch': 1})

        if tpo_doc:
            branch = normalize_branch_name(tpo_doc.get('branch'))

    return {
        'role': role,
        'branch': branch,
        'user_id': user_identity,
    }


@tpo_bp.route('/dashboard', methods=['GET'])
def get_dashboard_summary():
    """
    Dashboard summary API.
    Returns:
        - totalStudents
        - totalPlaced
        - totalCompanies
        - placementPercent
    Role logic:
        - MAIN_TPO: all data
        - BRANCH_TPO: filtered by branch
    """
    try:
        db = current_app.mongo_db
        email = request.args.get('email', type=str)
        user, tpo, error = _get_user_and_tpo_by_email(db, email)
        if error:
            return error

        role = _normalize_role(user.get('role'))
        branch = normalize_branch_name(tpo.get('branch'))

        if role not in ['MAIN_TPO', 'BRANCH_TPO']:
            return error_response('Only MAIN_TPO or BRANCH_TPO can access this resource', 403)

        placement_query = {}

        if role == 'BRANCH_TPO':
            if not branch:
                return error_response('Branch not found for BRANCH_TPO user', 400)
            placement_query['branch'] = branch

        # Count unique students from placement_records (not students collection)
        total_students = len(db.placement_records.distinct('student_id', placement_query))

        placed_query = dict(placement_query)
        placed_query['placed_status'] = True
        total_placed = db.placement_records.count_documents(placed_query)

        if role == 'BRANCH_TPO':
            company_names = db.placement_records.distinct('company_name', placement_query)
            company_names = [name for name in company_names if isinstance(name, str) and name.strip()]
            total_companies = db.companies.count_documents({'company_name': {'$in': company_names}}) if company_names else 0
        else:
            total_companies = db.companies.count_documents({})

        placement_percent = round((total_placed / total_students) * 100, 2) if total_students > 0 else 0.0

        result = {
            'totalStudents': total_students,
            'totalPlaced': total_placed,
            'totalCompanies': total_companies,
            'placementPercent': placement_percent,
        }

        return success_response(result, 'Dashboard summary retrieved', 200)

    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@tpo_bp.route('/recent-placements', methods=['GET'])
@jwt_required()
def get_recent_placements():
    """
    Recent placements API.
    Returns the latest 10 placement records.
    Role logic:
        - MAIN_TPO: all records
        - BRANCH_TPO: filtered by branch
    """
    try:
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role not in ['MAIN_TPO', 'BRANCH_TPO']:
            return error_response('Only MAIN_TPO or BRANCH_TPO can access this resource', 403)

        query = {}
        if role == 'BRANCH_TPO':
            if not branch:
                return error_response('Branch not found for BRANCH_TPO user', 400)
            query['branch'] = branch

        projection = {
            '_id': 0,
            'student_id': 1,
            'company_name': 1,
            'package_lpa': 1,
            'branch': 1,
            'placement_year': 1,
            'placed_status': 1,
        }

        records = list(
            db.placement_records.find(query, projection)
            .sort([('placement_year', -1), ('_id', -1)])
            .limit(10)
        )

        return success_response(records, 'Recent placements retrieved', 200)

    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@tpo_bp.route('/branch-stats', methods=['GET'])
def get_branch_stats():
    """
    Branch placement statistics for selected year.
    Query Params:
        - email (required)
        - year (required)
    Returns:
        [{ branch, total, placed, percent }]
    """
    try:
        db = current_app.mongo_db
        email = request.args.get('email', type=str)
        year = request.args.get('year', type=int)

        if year is None:
            return error_response('Year query parameter is required', 400)

        user, tpo, error = _get_user_and_tpo_by_email(db, email)
        if error:
            return error

        role = _normalize_role(user.get('role'))
        if role != 'MAIN_TPO':
            return error_response('Only MAIN_TPO can access branch statistics', 403)

        pipeline = [
            {'$match': {'placement_year': year}},
            {
                '$group': {
                    '_id': '$branch',
                    'total': {'$sum': 1},
                    'placed': {
                        '$sum': {
                            '$cond': [{'$eq': ['$placed_status', True]}, 1, 0]
                        }
                    }
                }
            },
            {'$sort': {'placed': -1}},
            {
                '$project': {
                    '_id': 0,
                    'branch': '$_id',
                    'total': 1,
                    'placed': 1,
                    'percent': {
                        '$cond': [
                            {'$eq': ['$total', 0]},
                            0,
                            {
                                '$round': [
                                    {
                                        '$multiply': [
                                            {'$divide': ['$placed', '$total']},
                                            100
                                        ]
                                    },
                                    2
                                ]
                            }
                        ]
                    }
                }
            }
        ]

        stats = list(db.placement_records.aggregate(pipeline))
        return success_response(stats, 'Branch statistics retrieved', 200)

    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@tpo_bp.route('/year-stats', methods=['GET'])
def get_year_stats():
    """
    Year-wise placement statistics.
    Query Params:
        - email (required)
    Returns:
        [{ year, total, placed, percent }]
    """
    try:
        db = current_app.mongo_db
        email = request.args.get('email', type=str)
        user, tpo, error = _get_user_and_tpo_by_email(db, email)
        if error:
            return error

        role = _normalize_role(user.get('role'))
        if role not in ['MAIN_TPO', 'BRANCH_TPO']:
            return error_response('Only MAIN_TPO or BRANCH_TPO can access year statistics', 403)

        match_stage = {}
        if role == 'BRANCH_TPO':
            branch = normalize_branch_name(tpo.get('branch'))
            if not branch:
                return error_response('Branch not found for BRANCH_TPO user', 400)
            match_stage = {'branch': branch}

        pipeline = [
            {'$match': match_stage},
            {
                '$group': {
                    '_id': '$placement_year',
                    'total': {'$sum': 1},
                    'placed': {
                        '$sum': {
                            '$cond': [{'$eq': ['$placed_status', True]}, 1, 0]
                        }
                    }
                }
            },
            {'$sort': {'_id': 1}},
            {
                '$project': {
                    '_id': 0,
                    'year': '$_id',
                    'total': 1,
                    'placed': 1,
                    'percent': {
                        '$cond': [
                            {'$eq': ['$total', 0]},
                            0,
                            {
                                '$round': [
                                    {
                                        '$multiply': [
                                            {'$divide': ['$placed', '$total']},
                                            100
                                        ]
                                    },
                                    2
                                ]
                            }
                        ]
                    }
                }
            }
        ]

        stats = list(db.placement_records.aggregate(pipeline))
        return success_response(stats, 'Year statistics retrieved', 200)

    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)

@tpo_bp.route('/profile', methods=['GET'])
def get_tpo_profile():
    """
    Get TPO profile information
    Returns: TPO name and assigned branch
    Requires: JWT token (TPO role)
    """
    try:
        db = current_app.mongo_db
        email = request.args.get('email', type=str)
        user, tpo, error = _get_user_and_tpo_by_email(db, email)
        if error:
            return error

        role = _normalize_role(user.get('role'))
        if role not in ['MAIN_TPO', 'BRANCH_TPO']:
            return error_response('Only MAIN_TPO or BRANCH_TPO can access TPO profile', 403)

        tpo_data = {
            'name': tpo.get('tpo_name'),
            'role': role,
            'branch': normalize_branch_name(tpo.get('branch')),
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
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role != 'BRANCH_TPO':
            return error_response('Only BRANCH_TPO can access this resource', 403)
        if not branch:
            return error_response('Branch not found for BRANCH_TPO user', 400)

        students = list(
            db.students.find(
                {'branch': branch},
                {
                    '_id': 0,
                    'userid': 1,
                    'student_id': 1,
                    'branch': 1,
                    'cgpa': 1,
                    'backlogs': 1,
                    'skills': 1,
                    'interested_field': 1,
                    'created_at': 1,
                },
            ).sort('created_at', -1)
        )

        return success_response(students, f'Students from {branch} retrieved', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


def _is_missing_value(value):
    if value is None:
        return True
    if isinstance(value, str) and not value.strip():
        return True
    return pd.isna(value)


def _sanitize_student_payload(data, forced_branch):
    student_id = str(data.get('student_id', '')).strip()
    cgpa = data.get('cgpa')
    backlogs = data.get('backlogs')

    if not student_id:
        raise ValueError('student_id is required')
    if _is_missing_value(cgpa):
        raise ValueError('cgpa is required')
    if _is_missing_value(backlogs):
        raise ValueError('backlogs is required')

    cgpa_value = float(cgpa)
    backlogs_value = int(float(backlogs))
    if backlogs_value < 0:
        raise ValueError('backlogs must be >= 0')

    student_id_clean = student_id.strip()
    default_email = f"{student_id_clean}@bvmengineering.ac.in"

    return {
        'student_id': student_id_clean,
        'branch': normalize_branch_name(forced_branch),
        'cgpa': cgpa_value,
        'backlogs': backlogs_value,
        'skills': [],
        'interested_field': [],
        'created_at': datetime.utcnow(),
    }, {
        'userid': student_id_clean,
        'email': default_email,
        'password': 'Student123',
        'role': 'Student',
    }


@tpo_bp.route('/students', methods=['POST'])
@jwt_required()
def add_student():
    """Add one student for the authenticated BRANCH_TPO branch."""
    try:
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role != 'BRANCH_TPO':
            return error_response('Only BRANCH_TPO can add students', 403)
        if not branch:
            return error_response('Branch not found for BRANCH_TPO user', 400)

        payload = request.get_json() or {}
        student, user_doc = _sanitize_student_payload(payload, branch)

        existing_student = db.students.find_one({'student_id': student['student_id']}, {'_id': 1})
        existing_user = db.users.find_one({'userid': student['student_id']}, {'_id': 1})
        if existing_student or existing_user:
            return error_response('student_id already exists in students/users collection', 409)

        user_insert = db.users.insert_one(user_doc)
        student['userid'] = str(user_insert.inserted_id)
        student['overall_prediction_score'] = calculate_score(student, db)
        student['last_updated'] = datetime.utcnow()
        try:
            db.students.insert_one(student)
        except Exception:
            db.users.delete_one({'_id': user_insert.inserted_id})
            raise

        return success_response(
            {
                'userid': student['userid'],
                'student_id': student['student_id'],
                'branch': student['branch'],
                'email': user_doc['email'],
                'overall_prediction_score': student['overall_prediction_score'],
            },
            'Student account created successfully',
            201,
        )
    except ValueError as exc:
        return error_response(str(exc), 400)
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@tpo_bp.route('/students/<student_id>', methods=['PUT'])
@jwt_required()
def update_student(student_id):
    """Update basic student academic fields (cgpa, backlogs) for BRANCH_TPO branch."""
    try:
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role != 'BRANCH_TPO':
            return error_response('Only BRANCH_TPO can update students', 403)
        if not branch:
            return error_response('Branch not found for BRANCH_TPO user', 400)

        payload = request.get_json() or {}
        updates = {}

        if 'cgpa' in payload:
            updates['cgpa'] = float(payload.get('cgpa'))
        if 'backlogs' in payload:
            updates['backlogs'] = int(float(payload.get('backlogs')))

        if not updates:
            return error_response('At least one field is required to update', 400)

        if 'backlogs' in updates and updates['backlogs'] < 0:
            return error_response('backlogs must be >= 0', 400)

        result = db.students.update_one(
            {'student_id': student_id, 'branch': branch},
            {'$set': updates},
        )

        if result.matched_count == 0:
            return error_response('Student not found', 404)

        updated = db.students.find_one(
            {'student_id': student_id, 'branch': branch},
            {
                '_id': 0,
                'student_id': 1,
                'branch': 1,
                'cgpa': 1,
                'backlogs': 1,
                'skills': 1,
                'interested_field': 1,
                'overall_prediction_score': 1,
                'last_updated': 1,
                'created_at': 1,
            },
        )
        score = update_student_score(db, student_id)
        if score is not None:
            updated['overall_prediction_score'] = score
        return success_response(updated, 'Student updated successfully', 200)
    except ValueError:
        return error_response('cgpa and backlogs must be valid numbers', 400)
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@tpo_bp.route('/students/<student_id>', methods=['DELETE'])
@jwt_required()
def delete_student(student_id):
    """Delete student for BRANCH_TPO branch and remove linked login account."""
    try:
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role != 'BRANCH_TPO':
            return error_response('Only BRANCH_TPO can delete students', 403)
        if not branch:
            return error_response('Branch not found for BRANCH_TPO user', 400)

        student_doc = db.students.find_one(
            {'student_id': student_id, 'branch': branch},
            {'_id': 1, 'student_id': 1, 'userid': 1}
        )
        if not student_doc:
            return error_response('Student not found', 404)

        db.students.delete_one({'student_id': student_id, 'branch': branch})
        linked_user_id = str(student_doc.get('userid') or '').strip()
        if ObjectId.is_valid(linked_user_id):
            db.users.delete_one({'_id': ObjectId(linked_user_id), 'role': 'Student'})
        else:
            db.users.delete_one({'userid': student_id, 'role': 'Student'})

        return success_response({'deleted': True, 'student_id': student_id}, 'Student deleted successfully', 200)
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@tpo_bp.route('/students/<student_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_student_password(student_id):
    """Reset one student's password to the default value for BRANCH_TPO branch."""
    try:
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role != 'BRANCH_TPO':
            return error_response('Only BRANCH_TPO can reset student password', 403)
        if not branch:
            return error_response('Branch not found for BRANCH_TPO user', 400)

        student_doc = db.students.find_one(
            {'student_id': student_id, 'branch': branch},
            {'_id': 1, 'student_id': 1, 'userid': 1}
        )
        if not student_doc:
            return error_response('Student not found', 404)

        linked_user_id = str(student_doc.get('userid') or '').strip()
        user_query = None
        if ObjectId.is_valid(linked_user_id):
            user_query = {'_id': ObjectId(linked_user_id), 'role': 'Student'}
        else:
            user_query = {'userid': student_id, 'role': 'Student'}

        result = db.users.update_one(user_query, {'$set': {'password': 'Student123'}})
        if result.matched_count == 0:
            return error_response('Linked student login account not found', 404)

        return success_response(
            {'student_id': student_id, 'default_password': 'Student123'},
            'Student password reset successfully',
            200,
        )
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@tpo_bp.route('/students/template/csv', methods=['GET'])
@jwt_required()
def download_students_template():
    """Return CSV template headers for students import."""
    db = current_app.mongo_db
    context = _resolve_user_context(db)
    role = context.get('role')

    if role != 'BRANCH_TPO':
        return error_response('Only BRANCH_TPO can download student template', 403)

    headers = ['student_id', 'cgpa', 'backlogs']
    csv_content = ','.join(headers) + '\n'

    return (
        csv_content,
        200,
        {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=students_template.csv'
        }
    )


@tpo_bp.route('/students/upload/csv', methods=['POST'])
@jwt_required()
def upload_students_csv():
    """Bulk upload students for authenticated BRANCH_TPO branch from CSV."""
    try:
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role != 'BRANCH_TPO':
            return error_response('Only BRANCH_TPO can upload students', 403)
        if not branch:
            return error_response('Branch not found for BRANCH_TPO user', 400)

        if 'file' not in request.files:
            return error_response('CSV file is required', 400)

        csv_file = request.files.get('file')
        if not csv_file or not csv_file.filename:
            return error_response('CSV file is required', 400)

        content = csv_file.read().decode('utf-8')
        dataframe = pd.read_csv(StringIO(content))

        expected_columns = {'student_id', 'cgpa', 'backlogs'}
        incoming_columns = set(dataframe.columns.astype(str).str.strip())

        if not expected_columns.issubset(incoming_columns):
            missing = sorted(list(expected_columns - incoming_columns))
            return error_response(f'Missing required CSV columns: {", ".join(missing)}', 400)

        existing_student_ids = set(db.students.distinct('student_id'))
        existing_user_ids = set(db.users.distinct('userid', {'role': 'Student'}))
        batch_ids = set()
        records_to_insert = []
        user_docs_to_insert = []
        skipped_invalid = 0
        skipped_duplicates = 0

        for _, row in dataframe.iterrows():
            try:
                payload = {
                    'student_id': row.get('student_id'),
                    'cgpa': row.get('cgpa'),
                    'backlogs': row.get('backlogs'),
                }
                student, user_doc = _sanitize_student_payload(payload, branch)
                student_id = student.get('student_id')

                if (
                    student_id in existing_student_ids
                    or student_id in existing_user_ids
                    or student_id in batch_ids
                ):
                    skipped_duplicates += 1
                    continue

                records_to_insert.append(student)
                user_docs_to_insert.append(user_doc)
                batch_ids.add(student_id)
            except Exception:
                skipped_invalid += 1

        if not records_to_insert:
            return error_response('No valid students found in CSV', 400)

        user_result = db.users.insert_many(user_docs_to_insert)
        linked_student_docs = []
        for student_doc, inserted_user_id in zip(records_to_insert, user_result.inserted_ids):
            linked_doc = dict(student_doc)
            linked_doc['userid'] = str(inserted_user_id)
            linked_doc['overall_prediction_score'] = calculate_score(linked_doc, db)
            linked_doc['last_updated'] = datetime.utcnow()
            linked_student_docs.append(linked_doc)

        try:
            student_result = db.students.insert_many(linked_student_docs)
        except Exception:
            db.users.delete_many({'_id': {'$in': user_result.inserted_ids}})
            raise

        return success_response(
            {
                'inserted': len(student_result.inserted_ids),
                'skipped_invalid': skipped_invalid,
                'skipped_duplicates': skipped_duplicates,
            },
            'Students CSV uploaded successfully',
            201,
        )
    except pd.errors.EmptyDataError:
        return error_response('CSV file is empty', 400)
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@tpo_bp.route('/update-student/<student_id>', methods=['PUT'])
@jwt_required()
def update_student_alias(student_id):
    """Alias endpoint for updating student academic fields."""
    return update_student(student_id)


@tpo_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    """Return students sorted by overall_prediction_score with role-based branch scope."""
    try:
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role not in ['MAIN_TPO', 'BRANCH_TPO']:
            return error_response('Only MAIN_TPO or BRANCH_TPO can access leaderboard', 403)

        query = {}
        requested_branch = normalize_branch_name(request.args.get('branch', type=str))
        if role == 'BRANCH_TPO':
            if not branch:
                return error_response('Branch not found for BRANCH_TPO user', 400)
            query['branch'] = branch
        elif requested_branch:
            query['branch'] = requested_branch

        search_query = str(request.args.get('q', '') or '').strip().lower()
        limit = request.args.get('limit', default=20, type=int)
        limit = max(1, min(limit, 200))

        docs = list(
            db.students.find(
                query,
                {
                    '_id': 0,
                    'student_id': 1,
                    'branch': 1,
                    'cgpa': 1,
                    'overall_prediction_score': 1,
                    'last_updated': 1,
                },
            )
        )

        items = []
        for doc in docs:
            student_id = str(doc.get('student_id') or '').strip()
            if search_query and search_query not in student_id.lower():
                continue

            score = float(doc.get('overall_prediction_score', 0) or 0)
            items.append({
                'student_id': student_id,
                'branch': doc.get('branch', ''),
                'cgpa': doc.get('cgpa'),
                'score': round(score, 2),
                'last_updated': doc.get('last_updated'),
            })

        items.sort(key=lambda row: (row.get('score', 0), row.get('cgpa') or 0), reverse=True)
        items = items[:limit]

        ranked = []
        for index, item in enumerate(items, start=1):
            ranked.append({
                'rank': index,
                **item,
            })

        return success_response(ranked, 'Leaderboard retrieved', 200)
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)

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
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')
        year = request.args.get('year', type=int)

        if role not in ['MAIN_TPO', 'BRANCH_TPO']:
            return error_response('Only MAIN_TPO or BRANCH_TPO can access this resource', 403)

        query = {}
        if role == 'BRANCH_TPO':
            if not branch:
                return error_response('Branch not found for BRANCH_TPO user', 400)
            query['branch'] = branch

        if year:
            query['placement_year'] = year

        projection = {
            'student_id': 1,
            'branch': 1,
            'cgpa': 1,
            'backlogs': 1,
            'placement_year': 1,
            'placed_status': 1,
            'company_name': 1,
            'package_lpa': 1,
            'domain': 1,
            'job_role': 1,
        }

        raw_records = list(db.placement_records.find(query, projection))
        current_app.logger.info(
            'placement-records:get role=%s branch=%s year=%s count=%s',
            role,
            branch,
            year,
            len(raw_records),
        )

        records = []
        for record in raw_records:
            company_name = str(record.get('company_name', '')).strip()
            domain = str(record.get('domain', '') or '').strip()
            job_role = str(record.get('job_role', '') or '').strip()

            records.append({
                'id': str(record.get('_id')),
                'student_id': record.get('student_id', ''),
                'branch': record.get('branch', ''),
                'cgpa': record.get('cgpa'),
                'backlogs': record.get('backlogs'),
                'placement_year': record.get('placement_year'),
                'placed_status': bool(record.get('placed_status', False)),
                'company_name': company_name,
                'package_lpa': record.get('package_lpa'),
                'domain': domain,
                'job_role': job_role,
            })

        if records:
            sample = records[0]
            current_app.logger.info(
                'placement-records:first student_id=%s placed_status=%s domain=%s job_role=%s',
                sample.get('student_id'),
                sample.get('placed_status'),
                sample.get('domain'),
                sample.get('job_role'),
            )

        return success_response(records, 'Placement records retrieved', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


def _parse_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    normalized = str(value).strip().lower()
    return normalized in ['1', 'true', 'yes', 'y', 'placed']


def _sanitize_placement_record(data, forced_branch):
    student_id = str(data.get('student_id', '')).strip()
    placement_year = data.get('placement_year')

    if not student_id:
        raise ValueError('student_id is required')
    if placement_year is None or str(placement_year).strip() == '':
        raise ValueError('placement_year is required')

    return {
        'student_id': student_id,
        'branch': normalize_branch_name(forced_branch),
        'cgpa': float(data.get('cgpa', 0) or 0),
        'backlogs': int(float(data.get('backlogs', 0) or 0)),
        'placement_year': int(float(placement_year)),
        'placed_status': _parse_bool(data.get('placed_status')),
        'company_name': str(data.get('company_name', '')).strip(),
        'package_lpa': float(data.get('package_lpa', 0) or 0),
        'domain': str(data.get('domain', '')).strip(),
        'job_role': str(data.get('job_role', '')).strip(),
    }


@tpo_bp.route('/placement-records', methods=['POST'])
@jwt_required()
def add_placement_record():
    """Add placement record manually with branch enforced from authenticated user context."""
    try:
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role != 'BRANCH_TPO':
            return error_response('Only BRANCH_TPO can add placement records', 403)
        if not branch:
            return error_response('Branch not found for BRANCH_TPO user', 400)

        payload = request.get_json() or {}
        record = _sanitize_placement_record(payload, branch)

        result = db.placement_records.insert_one(record)
        created = db.placement_records.find_one({'_id': result.inserted_id})

        return success_response({
            'id': str(created.get('_id')),
            'student_id': created.get('student_id'),
            'branch': created.get('branch'),
            'cgpa': created.get('cgpa'),
            'backlogs': created.get('backlogs'),
            'placement_year': created.get('placement_year'),
            'placed_status': created.get('placed_status'),
            'company_name': created.get('company_name'),
            'package_lpa': created.get('package_lpa'),
            'domain': created.get('domain'),
            'job_role': created.get('job_role'),
        }, 'Placement record added successfully', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@tpo_bp.route('/placement-records/<record_id>', methods=['PUT'])
@jwt_required()
def update_placement_record(record_id):
    """Update placement record by id; BRANCH_TPO can update only records from their branch."""
    try:
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role != 'BRANCH_TPO':
            return error_response('Only BRANCH_TPO can update placement records', 403)
        if not branch:
            return error_response('Branch not found for BRANCH_TPO user', 400)

        if not ObjectId.is_valid(record_id):
            return error_response('Invalid placement record id', 400)

        payload = request.get_json() or {}
        updates = _sanitize_placement_record(payload, branch)

        query = {'_id': ObjectId(record_id), 'branch': branch}
        result = db.placement_records.update_one(query, {'$set': updates})
        if result.matched_count == 0:
            return error_response('Placement record not found', 404)

        updated = db.placement_records.find_one({'_id': ObjectId(record_id)})
        return success_response({
            'id': str(updated.get('_id')),
            'student_id': updated.get('student_id'),
            'branch': updated.get('branch'),
            'cgpa': updated.get('cgpa'),
            'backlogs': updated.get('backlogs'),
            'placement_year': updated.get('placement_year'),
            'placed_status': updated.get('placed_status'),
            'company_name': updated.get('company_name'),
            'package_lpa': updated.get('package_lpa'),
            'domain': updated.get('domain'),
            'job_role': updated.get('job_role'),
        }, 'Placement record updated successfully', 200)
    except ValueError as exc:
        return error_response(str(exc), 400)
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@tpo_bp.route('/placement-records/<record_id>', methods=['DELETE'])
@jwt_required()
def delete_placement_record(record_id):
    """Delete placement record by id; BRANCH_TPO can delete only records from their branch."""
    try:
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role != 'BRANCH_TPO':
            return error_response('Only BRANCH_TPO can delete placement records', 403)
        if not branch:
            return error_response('Branch not found for BRANCH_TPO user', 400)

        if not ObjectId.is_valid(record_id):
            return error_response('Invalid placement record id', 400)

        result = db.placement_records.delete_one({'_id': ObjectId(record_id), 'branch': branch})
        if result.deleted_count == 0:
            return error_response('Placement record not found', 404)

        return success_response({'deleted': True}, 'Placement record deleted successfully', 200)
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@tpo_bp.route('/placement-records/upload', methods=['POST'])
@jwt_required()
def upload_placement_records_csv():
    """Bulk upload placement records from CSV with branch enforced from authenticated BRANCH_TPO."""
    try:
        db = current_app.mongo_db
        context = _resolve_user_context(db)
        role = context.get('role')
        branch = context.get('branch')

        if role != 'BRANCH_TPO':
            return error_response('Only BRANCH_TPO can upload placement records', 403)
        if not branch:
            return error_response('Branch not found for BRANCH_TPO user', 400)

        if 'file' not in request.files:
            return error_response('CSV file is required', 400)

        csv_file = request.files.get('file')
        if not csv_file or not csv_file.filename:
            return error_response('CSV file is required', 400)

        content = csv_file.read().decode('utf-8')
        dataframe = pd.read_csv(StringIO(content))

        expected_columns = {
            'student_id', 'branch', 'cgpa', 'backlogs', 'placement_year',
            'placed_status', 'company_name', 'package_lpa', 'domain', 'job_role'
        }

        incoming_columns = set(dataframe.columns.astype(str).str.strip())
        if not expected_columns.issubset(incoming_columns):
            missing = sorted(list(expected_columns - incoming_columns))
            return error_response(f'Missing required CSV columns: {", ".join(missing)}', 400)

        records_to_insert = []
        for _, row in dataframe.iterrows():
            try:
                item = {
                    'student_id': row.get('student_id'),
                    'cgpa': row.get('cgpa'),
                    'backlogs': row.get('backlogs'),
                    'placement_year': row.get('placement_year'),
                    'placed_status': row.get('placed_status'),
                    'company_name': row.get('company_name'),
                    'package_lpa': row.get('package_lpa'),
                    'domain': row.get('domain'),
                    'job_role': row.get('job_role'),
                }
                sanitized = _sanitize_placement_record(item, branch)
                records_to_insert.append(sanitized)
            except ValueError:
                continue

        if not records_to_insert:
            return error_response('No valid records found in CSV', 400)

        result = db.placement_records.insert_many(records_to_insert)
        return success_response({'inserted': len(result.inserted_ids)}, 'CSV uploaded successfully', 201)
    except pd.errors.EmptyDataError:
        return error_response('CSV file is empty', 400)
    except ValueError as exc:
        return error_response(str(exc), 400)
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@tpo_bp.route('/placement-records/template', methods=['GET'])
@jwt_required()
def download_placement_records_template():
    """Return CSV template headers for placement records import."""
    headers = [
        'student_id', 'branch', 'cgpa', 'backlogs', 'placement_year',
        'placed_status', 'company_name', 'package_lpa', 'domain', 'job_role'
    ]
    csv_content = ','.join(headers) + '\n'

    return (
        csv_content,
        200,
        {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=placement_records_template.csv'
        }
    )

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
        
        branch = normalize_branch_name(tpo.get('branch'))
        
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
