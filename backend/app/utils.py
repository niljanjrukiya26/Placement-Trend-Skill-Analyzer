"""
Utility functions for the application
Handles JWT, error responses, and database operations
"""
from flask import jsonify
from functools import wraps
from flask_jwt_extended import get_jwt_identity, get_jwt
from datetime import datetime
from bson.objectid import ObjectId
import bcrypt

def error_response(message, status_code=400, errors=None):
    """
    Generate standardized error response
    Args:
        message: Error message
        status_code: HTTP status code
        errors: Additional error details
    Returns:
        Tuple of (response dict, status code)
    """
    response = {
        'success': False,
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }
    if errors:
        response['errors'] = errors
    return jsonify(response), status_code

def success_response(data, message='Success', status_code=200):
    """
    Generate standardized success response
    Args:
        data: Response data
        message: Success message
        status_code: HTTP status code
    Returns:
        Tuple of (response dict, status code)
    """
    return jsonify({
        'success': True,
        'message': message,
        'data': data,
        'timestamp': datetime.utcnow().isoformat()
    }), status_code

def token_required(fn):
    """
    Custom decorator to protect routes with JWT
    Extracts user info from token claims
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            identity = get_jwt_identity()
            claims = get_jwt()
            kwargs['user_id'] = identity
            kwargs['user_role'] = claims.get('role')
            return fn(*args, **kwargs)
        except Exception as e:
            return error_response('Unauthorized: Invalid token', 401)
    return wrapper

def role_required(required_role):
    """
    Decorator to check user role
    Args:
        required_role: Required role(s) - string or list
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                claims = get_jwt()
                user_role = claims.get('role')
                
                if isinstance(required_role, list):
                    if user_role not in required_role:
                        return error_response(f'Forbidden: Requires {required_role} role', 403)
                else:
                    if user_role != required_role:
                        return error_response(f'Forbidden: Requires {required_role} role', 403)
                
                return fn(*args, **kwargs)
            except Exception as e:
                return error_response('Unauthorized', 401)
        return wrapper
    return decorator


def build_student_identity_query(db, identity):
    """Build a query that maps users.userid to students.student_id with legacy fallback."""
    safe_identity = str(identity or '').strip()
    if not safe_identity:
        return {'student_id': None}

    or_filters = [
        {'student_id': safe_identity},
        {'userid': safe_identity},
    ]

    if len(or_filters) == 1:
        return or_filters[0]
    return {'$or': or_filters}


def find_student_by_identity(db, identity, projection=None):
    """Find student document for the JWT identity across legacy and current link formats."""
    return db.students.find_one(build_student_identity_query(db, identity), projection)


def build_tpo_identity_query(db, identity):
    """Build a query that supports tpo_id lookup plus legacy string-linked TPO records."""
    safe_identity = str(identity or '').strip()
    if not safe_identity:
        return {'tpo_id': None}

    or_filters = [
        {'tpo_id': safe_identity},
        {'userid': safe_identity},
        {'user_id': safe_identity},
    ]

    if ObjectId.is_valid(safe_identity):
        object_id = ObjectId(safe_identity)
        user_doc = db.users.find_one({'_id': object_id}, {'_id': 0, 'userid': 1}) or {}
    else:
        user_doc = db.users.find_one({'userid': safe_identity}, {'_id': 0, 'userid': 1}) or {}

    linked_userid = str(user_doc.get('userid') or '').strip()
    if linked_userid and linked_userid != safe_identity:
        or_filters.append({'tpo_id': linked_userid})

    # De-duplicate repeated filters while keeping order stable.
    unique_filters = []
    seen = set()
    for item in or_filters:
        key = tuple(sorted(item.items()))
        if key in seen:
            continue
        seen.add(key)
        unique_filters.append(item)

    if len(unique_filters) == 1:
        return unique_filters[0]
    return {'$or': unique_filters}


def find_tpo_by_identity(db, identity, projection=None):
    """Find TPO document for the supplied identity across legacy and ObjectId-linked formats."""
    return db.tpo.find_one(build_tpo_identity_query(db, identity), projection)


def hash_password(raw_password):
    """Hash a plaintext password using bcrypt."""
    text = str(raw_password or '')
    if not text:
        raise ValueError('Password cannot be empty')

    return bcrypt.hashpw(text.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
