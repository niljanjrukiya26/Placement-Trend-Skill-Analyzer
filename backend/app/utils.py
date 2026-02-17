"""
Utility functions for the application
Handles JWT, error responses, and database operations
"""
from flask import jsonify
from functools import wraps
from flask_jwt_extended import get_jwt_identity, get_jwt
from datetime import datetime

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
