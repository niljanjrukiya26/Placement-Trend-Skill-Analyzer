"""Placements API routes."""

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
from pymongo.errors import PyMongoError

from app.branch_utils import normalize_branch_name
from app.utils import error_response, success_response, find_tpo_by_identity


placements_bp = Blueprint('placements', __name__, url_prefix='/api/placements')
job_roles_bp = Blueprint('job_roles', __name__, url_prefix='/api')


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _normalize_role(role_value):
    if not isinstance(role_value, str):
        return ''
    role = role_value.strip().upper()
    if role == 'TPO':
        return 'MAIN_TPO'
    return role


def _get_requester_context(db):
    """Resolve role and branch from JWT if present, without forcing auth."""
    role = ''
    branch = ''

    try:
        verify_jwt_in_request(optional=True)
        claims = get_jwt() or {}
        role = _normalize_role(claims.get('role'))
        user_id = get_jwt_identity()

        if role == 'BRANCH_TPO' and user_id:
            tpo_doc = find_tpo_by_identity(db, user_id, {'_id': 0, 'branch': 1})
            if tpo_doc:
                branch = normalize_branch_name(tpo_doc.get('branch'))
    except Exception:
        role = ''
        branch = ''

    return {
        'role': role,
        'branch': branch,
    }


def _placement_projection(doc):
    """Convert placement record into UI-friendly response shape."""
    return {
        'student_id': str(doc.get('student_id', '')),
        'branch': normalize_branch_name(doc.get('branch')),
        'cgpa': round(_safe_float(doc.get('cgpa')), 2),
        'backlogs': _safe_int(doc.get('backlogs')),
        'placement_year': _safe_int(doc.get('placement_year')),
        'placed_status': bool(doc.get('placed_status')),
        'company_name': str(doc.get('company_name', '')),
        'package_lpa': round(_safe_float(doc.get('package_lpa')), 2),
        'domain': str(doc.get('domain', '')),
        'job_role': str(doc.get('job_role', '')),
    }


@placements_bp.route('', methods=['GET'])
def get_placements():
    """Return placed students with role-aware filters in query params."""
    try:
        db = current_app.mongo_db

        role = (request.args.get('role') or '').strip().lower()
        branch = normalize_branch_name(request.args.get('branch') or '')
        job_role = (request.args.get('job_role') or '').strip()
        year = request.args.get('year', type=int)
        if year is None:
            year = request.args.get('placement_year', type=int)

        # Backward compatibility: if role is not supplied, infer from JWT.
        if role not in ['branch_tpo', 'main_tpo']:
            context = _get_requester_context(db)
            if context.get('role') == 'BRANCH_TPO':
                role = 'branch_tpo'
                if not branch:
                    branch = context.get('branch') or ''
            else:
                role = 'main_tpo'

        query = {'placed_status': True}
        if job_role:
            query['job_role'] = job_role
        if year:
            query['placement_year'] = year

        if role == 'branch_tpo':
            if not branch:
                return error_response('branch is required for role=branch_tpo', 400)
            query['branch'] = branch
        elif role == 'main_tpo' and branch:
            query['branch'] = branch

        cursor = db.placement_records.find(query, {'_id': 0}).sort('placement_year', -1)
        rows = [_placement_projection(doc) for doc in cursor]
        return jsonify(rows), 200
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@placements_bp.route('/filter', methods=['GET'])
def get_filtered_placements():
    """Backward-compatible filter endpoint mapped to GET /api/placements logic."""
    return get_placements()


@job_roles_bp.route('/job-roles', methods=['GET'])
def get_job_roles():
    """Return distinct job roles with role-aware branch visibility."""
    try:
        db = current_app.mongo_db

        role = (request.args.get('role') or '').strip().lower()
        branch = normalize_branch_name(request.args.get('branch') or '')

        if role not in ['branch_tpo', 'main_tpo']:
            context = _get_requester_context(db)
            if context.get('role') == 'BRANCH_TPO':
                role = 'branch_tpo'
                if not branch:
                    branch = context.get('branch') or ''
            else:
                role = 'main_tpo'

        query = {'placed_status': True}
        if role == 'branch_tpo':
            if not branch:
                return error_response('branch is required for role=branch_tpo', 400)
            query['branch'] = branch

        roles = db.placement_records.distinct('job_role', query)
        roles = sorted([role_name for role_name in roles if isinstance(role_name, str) and role_name.strip()])
        return jsonify(roles), 200
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@placements_bp.route('/stats', methods=['GET'])
def get_placement_stats():
    """Return total students, total placed, and placement percentage."""
    try:
        db = current_app.mongo_db

        total_students = db.placement_records.count_documents({})
        total_placed = db.placement_records.count_documents({'placed_status': True})
        placement_percentage = round((total_placed / total_students) * 100, 2) if total_students else 0.0

        return success_response(
            {
                'total_students': total_students,
                'total_placed': total_placed,
                'placement_percentage': placement_percentage,
            },
            'Placement stats retrieved successfully',
            200,
        )
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)


@placements_bp.route('/branch-stats', methods=['GET'])
def get_branch_stats():
    """Return branch-wise placed students count."""
    try:
        db = current_app.mongo_db
        pipeline = [
            {'$match': {'placed_status': True}},
            {'$group': {'_id': '$branch', 'placed': {'$sum': 1}}},
            {'$sort': {'placed': -1}},
        ]

        result = []
        for row in db.placement_records.aggregate(pipeline):
            result.append(
                {
                    'branch': normalize_branch_name(row.get('_id')),
                    'placed': _safe_int(row.get('placed')),
                }
            )

        return success_response(result, 'Branch-wise placement stats retrieved successfully', 200)
    except PyMongoError as exc:
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        return error_response(f'Server error: {str(exc)}', 500)
