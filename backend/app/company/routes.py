"""
Company API Routes
Handles CRUD and CSV upload for companies collection
"""
from io import StringIO
import csv
import re
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt
from bson import ObjectId
from app.utils import error_response, success_response

company_bp = Blueprint('company', __name__, url_prefix='/api')


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


def _normalize_domain(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [part.strip() for part in value.split(',') if part.strip()]
    return []


def _serialize_company(doc):
    return {
        'id': str(doc.get('_id')),
        'company_id': doc.get('company_id', ''),
        'company_name': doc.get('company_name', ''),
        'required_cgpa': doc.get('required_cgpa'),
        'minimum_pkg': doc.get('minimum_pkg'),
        'max_pkg': doc.get('max_pkg'),
        'year': doc.get('year'),
        'domain': doc.get('domain', []),
    }


@company_bp.route('/companies/next-id', methods=['GET'])
@jwt_required()
def get_next_company_id():
    try:
        db = current_app.mongo_db
        company_docs = list(db.companies.find({}, {'_id': 0, 'company_id': 1}))

        max_number = 0
        for doc in company_docs:
            value = str(doc.get('company_id', '')).strip()
            match = re.match(r'^C(\d+)$', value)
            if not match:
                continue
            max_number = max(max_number, int(match.group(1)))

        next_id = f"C{max_number + 1:03d}"
        return success_response({'company_id': next_id}, 'Next company id fetched successfully', 200)
    except Exception as exc:
        return error_response(f'Failed to fetch next company id: {str(exc)}', 500)


@company_bp.route('/domains', methods=['GET'])
@jwt_required()
def get_domains():
    try:
        db = current_app.mongo_db
        raw_domains = db.domain_job_roles.distinct('domain')
        domains = sorted({str(value).strip() for value in raw_domains if str(value).strip()})
        return success_response(domains, 'Domains fetched successfully', 200)
    except Exception as exc:
        return error_response(f'Failed to fetch domains: {str(exc)}', 500)


@company_bp.route('/companies', methods=['GET'])
@jwt_required()
def get_companies():
    try:
        db = current_app.mongo_db
        companies = list(db.companies.find({}))
        payload = [_serialize_company(company) for company in companies]
        return success_response(payload, 'Companies fetched successfully', 200)
    except Exception as exc:
        return error_response(f'Failed to fetch companies: {str(exc)}', 500)


@company_bp.route('/companies', methods=['POST'])
@jwt_required()
def add_company():
    try:
        if not _is_main_tpo_claims():
            return error_response('Only MAIN_TPO can access this resource', 403)

        db = current_app.mongo_db

        if request.files and 'file' in request.files:
            csv_file = request.files.get('file')
            if not csv_file or not csv_file.filename:
                return error_response('CSV file is required', 400)

            stream = StringIO(csv_file.stream.read().decode('utf-8'))
            reader = csv.DictReader(stream)

            rows_to_insert = []
            for row in reader:
                company_id = (row.get('company_id') or '').strip()
                company_name = (row.get('company_name') or '').strip()
                if not company_id or not company_name:
                    continue

                rows_to_insert.append({
                    'company_id': company_id,
                    'company_name': company_name,
                    'required_cgpa': float(row.get('required_cgpa') or 0),
                    'minimum_pkg': float(row.get('minimum_pkg') or 0),
                    'max_pkg': float(row.get('max_pkg') or 0),
                    'year': int(row.get('year') or 0),
                    'domain': _normalize_domain(row.get('domain', '')),
                })

            if not rows_to_insert:
                return error_response('No valid rows found in CSV', 400)

            db.companies.insert_many(rows_to_insert)
            return success_response({'inserted': len(rows_to_insert)}, 'CSV uploaded successfully', 201)

        data = request.get_json() or {}

        company_id = (data.get('company_id') or '').strip()
        company_name = (data.get('company_name') or '').strip()
        required_cgpa = data.get('required_cgpa')
        minimum_pkg = data.get('minimum_pkg')
        max_pkg = data.get('max_pkg')
        year = data.get('year')
        domain = _normalize_domain(data.get('domain', []))

        if not all([company_id, company_name, required_cgpa is not None, minimum_pkg is not None, max_pkg is not None, year is not None]):
            return error_response('company_id, company_name, required_cgpa, minimum_pkg, max_pkg, year are required', 400)

        company = {
            'company_id': company_id,
            'company_name': company_name,
            'required_cgpa': float(required_cgpa),
            'minimum_pkg': float(minimum_pkg),
            'max_pkg': float(max_pkg),
            'year': int(year),
            'domain': domain,
        }

        result = db.companies.insert_one(company)
        created = db.companies.find_one({'_id': result.inserted_id})
        return success_response(_serialize_company(created), 'Company added', 201)
    except Exception as exc:
        return error_response(f'Failed to add company: {str(exc)}', 500)


@company_bp.route('/companies/<company_id>', methods=['PUT'])
@jwt_required()
def update_company(company_id):
    try:
        if not _is_main_tpo_claims():
            return error_response('Only MAIN_TPO can access this resource', 403)

        data = request.get_json() or {}
        updates = {
            'company_id': (data.get('company_id') or '').strip(),
            'company_name': (data.get('company_name') or '').strip(),
            'required_cgpa': float(data.get('required_cgpa')) if data.get('required_cgpa') is not None else None,
            'minimum_pkg': float(data.get('minimum_pkg')) if data.get('minimum_pkg') is not None else None,
            'max_pkg': float(data.get('max_pkg')) if data.get('max_pkg') is not None else None,
            'year': int(data.get('year')) if data.get('year') is not None else None,
            'domain': _normalize_domain(data.get('domain', [])),
        }

        updates = {key: value for key, value in updates.items() if value is not None and not (isinstance(value, str) and not value)}
        if not updates:
            return error_response('No valid fields provided for update', 400)

        db = current_app.mongo_db

        if ObjectId.is_valid(company_id):
            query = {'_id': ObjectId(company_id)}
        else:
            query = {'company_id': company_id}

        result = db.companies.update_one(query, {'$set': updates})
        if result.matched_count == 0:
            return error_response('Company not found', 404)

        updated = db.companies.find_one(query)
        return success_response(_serialize_company(updated), 'Company updated', 200)
    except Exception as exc:
        return error_response(f'Failed to update company: {str(exc)}', 500)


@company_bp.route('/companies/<company_id>', methods=['DELETE'])
@jwt_required()
def delete_company(company_id):
    try:
        if not _is_main_tpo_claims():
            return error_response('Only MAIN_TPO can access this resource', 403)

        db = current_app.mongo_db

        if ObjectId.is_valid(company_id):
            query = {'_id': ObjectId(company_id)}
        else:
            query = {'company_id': company_id}

        result = db.companies.delete_one(query)
        if result.deleted_count == 0:
            return error_response('Company not found', 404)

        return success_response({'deleted': True}, 'Company deleted', 200)
    except Exception as exc:
        return error_response(f'Failed to delete company: {str(exc)}', 500)
