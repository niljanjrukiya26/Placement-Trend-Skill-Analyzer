"""
Domain Job Role API Routes
Handles CRUD operations for domain_job_roles collection
"""
import re
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt
from bson import ObjectId
from app.utils import error_response, success_response

domain_bp = Blueprint('domain', __name__, url_prefix='/api')


def _normalize_role(role_value):
    if not isinstance(role_value, str):
        return ''
    role = role_value.strip().upper()
    if role == 'TPO':
        return 'MAIN_TPO'
    return role


def _is_main_tpo_claims():
    claims = get_jwt() or {}
    return _normalize_role(claims.get('role')) == 'MAIN_TPO'


def _normalize_array(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [part.strip() for part in value.split(',') if part.strip()]
    return []


def _normalize_job_role_name(value):
    if not isinstance(value, str):
        return ''
    return ' '.join(value.split()).strip().lower()


def _job_role_exists_case_insensitive(db, job_role, exclude_id=None):
    normalized_target = _normalize_job_role_name(job_role)
    if not normalized_target:
        return False

    docs = list(db.domain_job_roles.find({}, {'_id': 1, 'job_role': 1}))
    for doc in docs:
        if exclude_id is not None and str(doc.get('_id')) == str(exclude_id):
            continue
        if _normalize_job_role_name(doc.get('job_role', '')) == normalized_target:
            return True
    return False


def _serialize_domain_role(doc):
    return {
        'id': str(doc.get('_id')),
        'job_role_id': doc.get('job_role_id'),
        'job_role': doc.get('job_role', ''),
        'domain': doc.get('domain', ''),
        'required_skills': doc.get('required_skills', []),
        'eligible_branches': doc.get('eligible_branches', []),
    }


def _build_query(identifier):
    if ObjectId.is_valid(identifier):
        return {'_id': ObjectId(identifier)}

    if isinstance(identifier, str) and re.match(r'^\d+$', identifier.strip()):
        return {'job_role_id': int(identifier.strip())}

    return {'job_role': identifier}


@domain_bp.route('/domain-job-roles/next-id', methods=['GET'])
@jwt_required()
def get_next_job_role_id():
    try:
        db = current_app.mongo_db
        docs = list(db.domain_job_roles.find({}, {'_id': 0, 'job_role_id': 1}))

        max_number = 0
        for doc in docs:
            value = doc.get('job_role_id')
            if isinstance(value, int):
                max_number = max(max_number, value)
            elif isinstance(value, str) and value.strip().isdigit():
                max_number = max(max_number, int(value.strip()))

        return success_response({'job_role_id': max_number + 1}, 'Next job role id fetched successfully', 200)
    except Exception as exc:
        return error_response(f'Failed to fetch next job role id: {str(exc)}', 500)


@domain_bp.route('/domain-options', methods=['GET'])
@jwt_required()
def get_domain_options():
    try:
        db = current_app.mongo_db
        domains = sorted({str(item).strip() for item in db.domain_job_roles.distinct('domain') if str(item).strip()})
        return success_response(domains, 'Domain options fetched successfully', 200)
    except Exception as exc:
        return error_response(f'Failed to fetch domain options: {str(exc)}', 500)


@domain_bp.route('/domain-job-roles/options/skills', methods=['GET'])
@jwt_required()
def get_skill_options_for_domain_roles():
    try:
        db = current_app.mongo_db
        skills = sorted({
            str(item).strip()
            for item in db.domain_job_roles.distinct('required_skills')
            if str(item).strip()
        })
        return success_response(skills, 'Skill options fetched successfully', 200)
    except Exception as exc:
        return error_response(f'Failed to fetch skill options: {str(exc)}', 500)


@domain_bp.route('/domain-job-roles/options/branches', methods=['GET'])
@jwt_required()
def get_branch_options_for_domain_roles():
    try:
        db = current_app.mongo_db
        branches = sorted({
            str(item).strip()
            for item in db.domain_job_roles.distinct('eligible_branches')
            if str(item).strip()
        })
        return success_response(branches, 'Branch options fetched successfully', 200)
    except Exception as exc:
        return error_response(f'Failed to fetch branch options: {str(exc)}', 500)


@domain_bp.route('/domain-job-roles', methods=['GET'])
@jwt_required()
def get_domain_job_roles():
    try:
        db = current_app.mongo_db
        query = {}

        domain = (request.args.get('domain') or '').strip()
        if domain:
            query['domain'] = domain

        records = list(db.domain_job_roles.find(query))
        payload = [_serialize_domain_role(record) for record in records]
        return success_response(payload, 'Domain job roles fetched successfully', 200)
    except Exception as exc:
        return error_response(f'Failed to fetch domain job roles: {str(exc)}', 500)


@domain_bp.route('/domain-job-roles', methods=['POST'])
@jwt_required()
def add_domain_job_role():
    try:
        if not _is_main_tpo_claims():
            return error_response('Only MAIN_TPO can access this resource', 403)

        db = current_app.mongo_db
        data = request.get_json() or {}

        job_role = (data.get('job_role') or '').strip()
        domain = (data.get('domain') or '').strip()
        required_skills = _normalize_array(data.get('required_skills', []))
        eligible_branches = _normalize_array(data.get('eligible_branches', []))

        if not job_role or not domain:
            return error_response('job_role and domain are required', 400)

        if not required_skills:
            return error_response('At least one required skill is required', 400)

        if not eligible_branches:
            return error_response('At least one eligible branch is required', 400)

        if _job_role_exists_case_insensitive(db, job_role):
            return error_response('Job role with this name already exists', 409)

        incoming_job_role_id = data.get('job_role_id')
        if incoming_job_role_id is not None and str(incoming_job_role_id).strip().isdigit():
            job_role_id = int(str(incoming_job_role_id).strip())
        else:
            docs = list(db.domain_job_roles.find({}, {'_id': 0, 'job_role_id': 1}))
            max_number = 0
            for doc in docs:
                value = doc.get('job_role_id')
                if isinstance(value, int):
                    max_number = max(max_number, value)
                elif isinstance(value, str) and value.strip().isdigit():
                    max_number = max(max_number, int(value.strip()))
            job_role_id = max_number + 1

        payload = {
            'job_role_id': job_role_id,
            'job_role': job_role,
            'domain': domain,
            'required_skills': required_skills,
            'eligible_branches': eligible_branches,
        }

        result = db.domain_job_roles.insert_one(payload)
        created = db.domain_job_roles.find_one({'_id': result.inserted_id})
        return success_response(_serialize_domain_role(created), 'Domain job role added', 201)
    except Exception as exc:
        return error_response(f'Failed to add domain job role: {str(exc)}', 500)


@domain_bp.route('/domain-job-roles/<identifier>', methods=['PUT'])
@jwt_required()
def update_domain_job_role(identifier):
    try:
        if not _is_main_tpo_claims():
            return error_response('Only MAIN_TPO can access this resource', 403)

        db = current_app.mongo_db
        data = request.get_json() or {}

        updates = {
            'job_role': (data.get('job_role') or '').strip(),
            'domain': (data.get('domain') or '').strip(),
            'required_skills': _normalize_array(data.get('required_skills', [])),
            'eligible_branches': _normalize_array(data.get('eligible_branches', [])),
        }

        incoming_id = data.get('job_role_id')
        if incoming_id is not None and str(incoming_id).strip().isdigit():
            updates['job_role_id'] = int(str(incoming_id).strip())

        updates = {
            key: value
            for key, value in updates.items()
            if value is not None and not (isinstance(value, str) and not value)
        }

        if not updates:
            return error_response('No valid fields provided for update', 400)

        query = _build_query(identifier)
        existing = db.domain_job_roles.find_one(query)
        if not existing:
            return error_response('Domain job role not found', 404)

        candidate_job_role = updates.get('job_role', existing.get('job_role', ''))
        if _job_role_exists_case_insensitive(db, candidate_job_role, exclude_id=existing.get('_id')):
            return error_response('Job role with this name already exists', 409)

        result = db.domain_job_roles.update_one(query, {'$set': updates})
        if result.matched_count == 0:
            return error_response('Domain job role not found', 404)

        updated = db.domain_job_roles.find_one(query)
        return success_response(_serialize_domain_role(updated), 'Domain job role updated', 200)
    except Exception as exc:
        return error_response(f'Failed to update domain job role: {str(exc)}', 500)


@domain_bp.route('/domain-job-roles/<identifier>', methods=['DELETE'])
@jwt_required()
def delete_domain_job_role(identifier):
    try:
        if not _is_main_tpo_claims():
            return error_response('Only MAIN_TPO can access this resource', 403)

        db = current_app.mongo_db
        query = _build_query(identifier)
        result = db.domain_job_roles.delete_one(query)
        if result.deleted_count == 0:
            return error_response('Domain job role not found', 404)

        return success_response({'deleted': True}, 'Domain job role deleted', 200)
    except Exception as exc:
        return error_response(f'Failed to delete domain job role: {str(exc)}', 500)