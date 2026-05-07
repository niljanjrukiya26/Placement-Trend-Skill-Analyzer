"""
Authentication Routes
Handles user login and JWT token generation
"""
from flask import Blueprint, request, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from pymongo.errors import PyMongoError
from werkzeug.security import check_password_hash
from app.utils import error_response, success_response, hash_password
import bcrypt
from datetime import timedelta, datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _verify_password(stored_password, incoming_password):
    """
    Verify password and tell caller whether stored password should be migrated to bcrypt.
    Returns: (is_valid, should_rehash)
    """
    if stored_password is None:
        return False, False
    
    stored_text = str(stored_password)
    incoming_text = str(incoming_password)

    # Prefer bcrypt verification for current passwords.
    try:
        if stored_text.startswith('$2a$') or stored_text.startswith('$2b$') or stored_text.startswith('$2y$'):
            is_valid = bcrypt.checkpw(incoming_text.encode('utf-8'), stored_text.encode('utf-8'))
            return is_valid, False
    except Exception:
        pass

    # Legacy werkzeug hashed passwords.
    try:
        if check_password_hash(stored_text, incoming_text):
            return True, True
    except Exception:
        pass

    # Legacy plaintext records: allow once, then migrate to bcrypt.
    if stored_text == incoming_text:
        return True, True

    return False, False


def _default_password_for_role(role):
    normalized_role = str(role or '').upper()
    if normalized_role == 'STUDENT':
        return 'Student123'
    if normalized_role in ['TPO', 'MAIN_TPO', 'BRANCH_TPO']:
        return 'TPO123'
    return None


def _normalize_date_value(value):
    """Normalize date-like values to YYYY-MM-DD for comparison."""
    if value is None:
        return ''

    if isinstance(value, datetime):
        return value.date().isoformat()

    try:
        text = str(value).strip()
        if not text:
            return ''

        # Handle common date string formats and full timestamps.
        parsed = datetime.fromisoformat(text.replace('Z', '+00:00'))
        return parsed.date().isoformat()
    except ValueError:
        text = str(value).strip()
        for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m-%d-%Y', '%m/%d/%Y'):
            try:
                return datetime.strptime(text, fmt).date().isoformat()
            except ValueError:
                continue
        return text

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
        current_app.logger.info(f'Login attempt: identifier={raw_identifier}, email_identifier={email_identifier}, user_identifier={user_identifier}')
        user = db.users.find_one({
            '$or': [
                {
                    'email': {
                        '$regex': f'^{email_identifier}$',
                        '$options': 'i'
                    }
                },
                {'userid': raw_identifier},
                {'userid': user_identifier},
            ]
        })
        
        if not user:
            current_app.logger.warning(f'User not found for identifier: {raw_identifier} (email: {email_identifier}, userid: {user_identifier})')
            return error_response('Invalid student ID/email or password', 401)
        
        is_valid_password, should_rehash = _verify_password(user.get('password'), password)
        if not is_valid_password:
            current_app.logger.warning(f'Password mismatch for user: {user.get("userid")}')
            return error_response('Invalid student ID/email or password', 401)

        if should_rehash:
            db.users.update_one(
                {'_id': user.get('_id')},
                {'$set': {'password': hash_password(password)}},
            )
        
        # Generate JWT token with user claims
        user_id = str(user.get('userid') or user.get('_id'))
        if not user_id or user_id == 'None':
            return error_response('Invalid user record: userid missing', 500)

        role = user.get('role', 'Student')
        default_password = _default_password_for_role(role)
        requires_password_change = bool(user.get('must_change_password')) or (
            default_password is not None and str(password) == default_password
        )

        branch = None
        if role in ['TPO', 'MAIN_TPO', 'BRANCH_TPO']:
            tpo_profile = db.tpo.find_one({'tpo_id': user.get('userid')}, {'_id': 0, 'branch': 1})
            if tpo_profile:
                branch = tpo_profile.get('branch')
        
        additional_claims = {
            'role': role,
            'email': user.get('email')
        }
        
        if requires_password_change:
            change_token = create_access_token(
                identity=user_id,
                additional_claims={**additional_claims, 'purpose': 'password_change'},
                expires_delta=timedelta(minutes=15),
            )
            current_app.logger.info(f'Password change required for user: {user_id} (role: {role})')
            return success_response({
                'must_change_password': True,
                'password_change_token': change_token,
                'user_id': user_id,
                'role': role,
                'email': user.get('email'),
                'branch': branch,
            }, 'Password change required', 200)

        access_token = create_access_token(
            identity=user_id,
            additional_claims=additional_claims
        )
        
        current_app.logger.info(f'Login successful for user: {user_id} (role: {role})')
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


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password after first login using DOB verification."""
    try:
        claims = get_jwt() or {}
        if claims.get('purpose') != 'password_change':
            return error_response('Invalid password change session', 403)

        user_id = str(get_jwt_identity() or '').strip()
        if not user_id:
            return error_response('Invalid user session', 400)

        data = request.get_json() or {}
        date_of_birth = str(data.get('date_of_birth') or '').strip()
        new_password = str(data.get('new_password') or '')
        confirm_password = str(data.get('confirm_password') or '')

        if not date_of_birth or not new_password or not confirm_password:
            return error_response('date_of_birth, new_password and confirm_password are required', 400)

        if new_password != confirm_password:
            return error_response('New password and confirm password do not match', 400)

        if len(new_password) < 6:
            return error_response('New password must be at least 6 characters long', 400)

        db = current_app.mongo_db
        user = db.users.find_one({'userid': user_id}, {'_id': 1, 'userid': 1, 'role': 1, 'email': 1, 'must_change_password': 1})
        if not user:
            return error_response('User not found', 404)

        default_password = _default_password_for_role(user.get('role'))
        if default_password and new_password == default_password:
            return error_response('New password cannot be the default password', 400)

        role = user.get('role', '')
        profile_doc = None
        normalized_role = str(role or '').upper()
        if normalized_role == 'STUDENT':
            profile_doc = db.students.find_one({'student_id': user_id}, {'_id': 0, 'date_of_birth': 1})
        elif normalized_role in ['TPO', 'MAIN_TPO', 'BRANCH_TPO']:
            profile_doc = db.tpo.find_one({'tpo_id': user_id}, {'_id': 0, 'date_of_birth': 1})

        if not profile_doc:
            return error_response('Profile not found for DOB verification', 404)

        stored_dob = _normalize_date_value(profile_doc.get('date_of_birth'))
        provided_dob = _normalize_date_value(date_of_birth)
        if stored_dob != provided_dob:
            return error_response('Date of birth does not match our records', 400)

        db.users.update_one(
            {'_id': user.get('_id')},
            {'$set': {
                'password': hash_password(new_password),
                'must_change_password': False,
                'password_changed_at': datetime.utcnow(),
            }},
        )

        return success_response({
            'user_id': user_id,
            'role': role,
            'must_change_password': False,
        }, 'Password changed successfully', 200)
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
