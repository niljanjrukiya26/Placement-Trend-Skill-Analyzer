"""
Authentication Routes
Handles user login and JWT token generation
"""
from flask import Blueprint, request, current_app
from flask_jwt_extended import create_access_token
from pymongo.errors import PyMongoError
from werkzeug.security import check_password_hash
from app.utils import error_response, success_response
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login endpoint - Authenticate user and return JWT token
    Expected JSON:
    {
        "email": "student@example.com",
        "password": "password123"
    }
    Returns:
        - JWT token
        - User role (Student/TPO)
        - User ID
    """
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('email') or not data.get('password'):
            return error_response('Email and password are required', 400)
        
        email = data.get('email').strip().lower()
        password = data.get('password')
        
        # Query user from database
        db = current_app.mongo_db
        user = db.users.find_one({'email': email})
        
        if not user:
            return error_response('Invalid email or password', 401)
        
        # For MVP: Simple password validation (In production: use hashed passwords)
        # This is a simplified check - in production use proper password hashing
        if user.get('password') != password:
            return error_response('Invalid email or password', 401)
        
        # Generate JWT token with user claims
        user_id = str(user['_id']) if '_id' in user else str(user.get('userid'))
        role = user.get('role', 'Student')
        
        additional_claims = {
            'role': role,
            'email': email
        }
        
        access_token = create_access_token(
            identity=user_id,
            additional_claims=additional_claims
        )
        
        return success_response({
            'access_token': access_token,
            'user_id': user_id,
            'role': role,
            'email': email
        }, 'Login successful', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logout endpoint (Simple - token is validated on client side)
    """
    return success_response({}, 'Logout successful', 200)

@auth_bp.route('/validate-token', methods=['GET'])
def validate_token():
    """
    Validate if token is still valid
    Requires JWT in Authorization header
    """
    try:
        from app.utils import token_required
        from flask_jwt_extended import get_jwt_identity
        
        @token_required
        def check():
            user_id = get_jwt_identity()
            return success_response({
                'valid': True,
                'user_id': user_id
            }, 'Token is valid', 200)
        
        return check()
    except Exception as e:
        return error_response('Invalid token', 401)
