"""
Authentication Routes
Handles user login and JWT token generation
"""
from flask import Blueprint, request, current_app
from flask_jwt_extended import create_access_token
from pymongo.errors import PyMongoError
from werkzeug.security import check_password_hash
from app.utils import error_response, success_response

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _verify_password(stored_password, incoming_password):
    """Support both legacy plain-text and hashed passwords."""
    if stored_password is None:
        return False

    stored_text = str(stored_password)
    incoming_text = str(incoming_password)

    if stored_text == incoming_text:
        return True

    try:
        return check_password_hash(stored_text, incoming_text)
    except ValueError:
        # Not a valid hash string, treat as plain-text mismatch.
        return False

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login endpoint - Authenticate user and return JWT token
    Expected JSON:
    {
        "identifier": "student@example.com or 22IT101",
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
        identifier = (data or {}).get('identifier') or (data or {}).get('email')
        if not data or not identifier or not data.get('password'):
            return error_response('Student ID/Email and password are required', 400)

        raw_identifier = str(identifier).strip()
        email_identifier = raw_identifier.lower()
        user_identifier = raw_identifier.upper()
        password = data.get('password')
        
        # Query user from database
        db = current_app.mongo_db
        user = db.users.find_one({
            '$or': [
                {'email': email_identifier},
                {'userid': raw_identifier},
                {'userid': user_identifier},
            ]
        })
        
        if not user:
            return error_response('Invalid student ID/email or password', 401)
        
        if not _verify_password(user.get('password'), password):
            return error_response('Invalid student ID/email or password', 401)
        
        # Generate JWT token with user claims
        user_id = str(user.get('userid') or user.get('_id'))
        if not user_id or user_id == 'None':
            return error_response('Invalid user record: userid missing', 500)

        role = user.get('role', 'Student')

        branch = None
        if role in ['TPO', 'MAIN_TPO', 'BRANCH_TPO']:
            tpo_profile = db.tpo.find_one({'userid': user.get('userid')}, {'_id': 0, 'branch': 1})
            if tpo_profile:
                branch = tpo_profile.get('branch')
        
        additional_claims = {
            'role': role,
            'email': user.get('email')
        }
        
        access_token = create_access_token(
            identity=user_id,
            additional_claims=additional_claims
        )
        
        return success_response({
            'access_token': access_token,
            'user_id': user_id,
            'role': role,
            'email': user.get('email'),
            'branch': branch,
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
