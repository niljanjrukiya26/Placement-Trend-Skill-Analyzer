"""
Analytics API Routes
Handles placement and skill demand analytics
"""
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required
from pymongo.errors import PyMongoError
from app.utils import error_response, success_response
from app.branch_utils import normalize_branch_name

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')
job_role_insights_bp = Blueprint('job_role_insights', __name__, url_prefix='/api')


def _build_placement_insights_pipeline(selected_role):
    normalized_role = selected_role.lower()

    return [
        {
            '$match': {
                'placed_status': True,
                '$expr': {
                    '$eq': [
                        {
                            '$toLower': {
                                '$trim': {
                                    'input': {'$ifNull': ['$job_role', '']}
                                }
                            }
                        },
                        normalized_role
                    ]
                }
            }
        },
        {
            '$group': {
                '_id': {
                    'company_name': '$company_name',
                    'branch': '$branch',
                    'placement_year': '$placement_year'
                },
                'total_hired': {'$sum': 1}
            }
        },
        {
            '$project': {
                '_id': 0,
                'company_name': '$_id.company_name',
                'branch': '$_id.branch',
                'placement_year': '$_id.placement_year',
                'total_hired': 1
            }
        },
        {
            '$lookup': {
                'from': 'companies',
                'let': {
                    'placement_company_name': '$company_name',
                    'placement_year': '$placement_year'
                },
                'pipeline': [
                    {
                        '$match': {
                            '$expr': {
                                '$and': [
                                    {'$eq': ['$company_name', '$$placement_company_name']},
                                    {'$eq': ['$year', '$$placement_year']}
                                ]
                            }
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'required_cgpa': 1,
                            'min_pkg': {'$ifNull': ['$min_pkg', '$minimum_pkg']},
                            'max_pkg': 1
                        }
                    },
                    {'$limit': 1}
                ],
                'as': 'company_details'
            }
        },
        {
            '$unwind': {
                'path': '$company_details',
                'preserveNullAndEmptyArrays': True
            }
        },
        {
            '$project': {
                'company_name': 1,
                'branch': 1,
                'placement_year': 1,
                'total_hired': 1,
                'required_cgpa': '$company_details.required_cgpa',
                'min_pkg': '$company_details.min_pkg',
                'max_pkg': '$company_details.max_pkg'
            }
        },
        {
            '$sort': {
                'company_name': 1,
                'branch': 1,
                'placement_year': 1
            }
        },
        {
            '$group': {
                '_id': {
                    'company_name': '$company_name',
                    'branch': '$branch'
                },
                'years': {
                    '$push': {
                        'year': '$placement_year',
                        'total_hired': '$total_hired',
                        'required_cgpa': '$required_cgpa',
                        'min_pkg': '$min_pkg',
                        'max_pkg': '$max_pkg'
                    }
                }
            }
        },
        {
            '$sort': {
                '_id.company_name': 1,
                '_id.branch': 1
            }
        },
        {
            '$group': {
                '_id': '$_id.company_name',
                'branches': {
                    '$push': {
                        'branch': '$_id.branch',
                        'years': '$years'
                    }
                }
            }
        },
        {
            '$project': {
                '_id': 0,
                'company_name': '$_id',
                'branches': 1
            }
        },
        {
            '$sort': {'company_name': 1}
        }
    ]


def _get_placement_insights_response(job_role):
    selected_role = (job_role or '').strip()
    if not selected_role:
        return error_response('job_role is required', 400)

    db = current_app.mongo_db
    pipeline = _build_placement_insights_pipeline(selected_role)
    insights = list(db.placement_records.aggregate(pipeline))
    return success_response(insights, 'Placement insights retrieved successfully', 200)


@job_role_insights_bp.route('/placement-insights/<job_role>', methods=['GET'])
@jwt_required()
def get_placement_insights(job_role):
    """Get company-wise nested placement insights for a selected job role."""
    try:
        return _get_placement_insights_response(job_role)
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@job_role_insights_bp.route('/job-role-insights/<job_role>', methods=['GET'])
@jwt_required()
def get_job_role_insights(job_role):
    """Backward-compatible alias for old insight URL."""
    try:
        return _get_placement_insights_response(job_role)
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)

@analytics_bp.route('/placement/yearwise', methods=['GET'])
@jwt_required()
def get_yearwise_placement():
    """
    Get year-wise placement statistics
    Returns:
        - Year
        - Total students placed in that year
        - Total students appearing in that year
        - Placement percentage
    """
    try:
        db = current_app.mongo_db
        
        # Aggregation pipeline to get year-wise statistics
        pipeline = [
            {
                '$group': {
                    '_id': '$placement_year',
                    'total_students': {'$sum': 1},
                    'placed_students': {
                        '$sum': {
                            '$cond': [{'$eq': ['$placed_status', True]}, 1, 0]
                        }
                    }
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'year': '$_id',
                    'total_students': 1,
                    'placed_students': 1,
                    'placement_percentage': {
                        '$round': [
                            {
                                '$multiply': [
                                    {'$divide': ['$placed_students', '$total_students']},
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            {
                '$sort': {'year': 1}
            }
        ]
        
        results = list(db.placement_records.aggregate(pipeline))
        
        return success_response(results, 'Year-wise placement data retrieved', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)

@analytics_bp.route('/placement/branchwise', methods=['GET'])
@jwt_required()
def get_branchwise_placement():
    """
    Get branch-wise placement statistics for a given year
    Query Parameters:
        - year: YYYY format (required)
    Returns:
        - Branch
        - Total students in branch
        - Placed students in branch
        - Placement percentage
    """
    try:
        year = request.args.get('year', type=int)
        
        if not year:
            return error_response('Year parameter is required', 400)
        
        db = current_app.mongo_db
        
        # Aggregation pipeline for branch-wise statistics
        pipeline = [
            {
                '$match': {'placement_year': year}
            },
            {
                '$group': {
                    '_id': '$branch',
                    'total_students': {'$sum': 1},
                    'placed_students': {
                        '$sum': {
                            '$cond': [{'$eq': ['$placed_status', True]}, 1, 0]
                        }
                    }
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'branch': '$_id',
                    'total_students': 1,
                    'placed_students': 1,
                    'placement_percentage': {
                        '$round': [
                            {
                                '$multiply': [
                                    {'$divide': ['$placed_students', '$total_students']},
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            {
                '$sort': {'branch': 1}
            }
        ]
        
        raw_results = list(db.placement_records.aggregate(pipeline))

        # Normalize branch labels and merge duplicate buckets caused by legacy codes.
        merged_stats = {}
        for row in raw_results:
            normalized_branch = normalize_branch_name(row.get('branch', ''))
            if not normalized_branch:
                continue

            if normalized_branch not in merged_stats:
                merged_stats[normalized_branch] = {
                    'branch': normalized_branch,
                    'total_students': 0,
                    'placed_students': 0
                }

            merged_stats[normalized_branch]['total_students'] += row.get('total_students', 0)
            merged_stats[normalized_branch]['placed_students'] += row.get('placed_students', 0)

        results = []
        for branch, stats in merged_stats.items():
            total_students = stats['total_students']
            placed_students = stats['placed_students']
            placement_percentage = round((placed_students / total_students) * 100, 2) if total_students else 0

            results.append({
                'branch': branch,
                'total_students': total_students,
                'placed_students': placed_students,
                'placement_percentage': placement_percentage
            })

        results.sort(key=lambda item: item['branch'])
        
        if not results:
            return success_response([], f'No placement data found for year {year}', 200)
        
        return success_response(results, f'Branch-wise placement data retrieved for {year}', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)

@analytics_bp.route('/skills/top', methods=['GET'])
@jwt_required()
def get_top_demanded_skills():
    """
    Get top demanded skills across all job roles
    Aggregates required_skills from job_roles collection
    Query Parameters:
        - limit: Number of top skills (default: 10)
    Returns:
        - Skill name
        - Frequency (count of job roles requiring the skill)
    """
    try:
        limit = request.args.get('limit', default=10, type=int)
        
        if limit < 1 or limit > 50:
            limit = 10
        
        db = current_app.mongo_db
        
        # Aggregation to get skills and their frequency
        pipeline = [
            {
                '$unwind': '$required_skills'
            },
            {
                '$group': {
                    '_id': '$required_skills',
                    'frequency': {'$sum': 1}
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'skill': '$_id',
                    'frequency': 1
                }
            },
            {
                '$sort': {'frequency': -1}
            },
            {
                '$limit': limit
            }
        ]
        
        results = list(db.job_roles.aggregate(pipeline))
        
        if not results:
            return success_response([], 'No skill data found', 200)
        
        return success_response(results, 'Top demanded skills retrieved', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)

@analytics_bp.route('/companies/overview', methods=['GET'])
@jwt_required()
def get_companies_overview():
    """
    Get overview of companies and job roles
    Returns list of companies with their job roles and requirements
    """
    try:
        db = current_app.mongo_db
        
        # Find all companies
        companies = list(db.companies.find({}, {'_id': 0}))
        
        # Enrich with job role details
        for company in companies:
            job_roles = company.get('job_roles', [])
            role_details = []
            
            for role in job_roles:
                role_info = db.job_roles.find_one(
                    {'job_role': role},
                    {'_id': 0}
                )
                if role_info:
                    role_details.append(role_info)
            
            company['role_details'] = role_details
        
        return success_response(companies, 'Companies overview retrieved', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@analytics_bp.route('/domain-job-roles', methods=['GET'])
@jwt_required()
def get_domain_job_roles():
    """
    Get domain-wise job roles from domain_job_roles collection.
    Optional query parameters:
        - domain: exact domain name match
        - branch: branch value (normalized to canonical full name)
    """
    try:
        db = current_app.mongo_db

        domain = request.args.get('domain', type=str)
        branch = request.args.get('branch', type=str)

        query = {}
        if domain:
            query['domain'] = domain.strip()

        if branch:
            normalized_branch = normalize_branch_name(branch)
            if normalized_branch:
                query['eligible_branches'] = normalized_branch

        domain_roles = list(db.domain_job_roles.find(query, {'_id': 0}))

        if not domain_roles:
            return success_response([], 'No domain job roles found', 200)

        return success_response(domain_roles, 'Domain job roles retrieved successfully', 200)

    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@analytics_bp.route('/job-roles', methods=['GET'])
@jwt_required()
def get_job_roles():
    """
    Get all job roles available in the system
    Returns:
        - List of job roles with required_skills and eligible_branches
    """
    try:
        db = current_app.mongo_db
        
        # Fetch all job roles from collection
        job_roles = list(db.job_roles.find({}, {'_id': 0}))
        
        if not job_roles:
            return success_response([], 'No job roles found', 200)
        
        return success_response(job_roles, 'Job roles retrieved successfully', 200)
    
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@analytics_bp.route('/skills/options', methods=['GET'])
@jwt_required()
def get_skill_options():
    """
    Get distinct skill options from job_roles collection
    Returns:
        - List of unique skill names
    """
    try:
        db = current_app.mongo_db

        pipeline = [
            {'$unwind': '$required_skills'},
            {'$group': {'_id': '$required_skills'}},
            {'$project': {'_id': 0, 'skill': '$_id'}},
            {'$sort': {'skill': 1}}
        ]

        results = list(db.job_roles.aggregate(pipeline))
        skills = [item.get('skill') for item in results if item.get('skill')]

        return success_response(skills, 'Skill options retrieved successfully', 200)

    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@analytics_bp.route('/interests/options', methods=['GET'])
@jwt_required()
def get_interested_field_options():
    """
    Get distinct interested field options from students collection
    Returns:
        - List of unique interested fields
    """
    try:
        db = current_app.mongo_db
        interests = set()

        for student in db.students.find({}, {'interested_field': 1}):
            value = student.get('interested_field')
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, str) and item.strip():
                        interests.add(item.strip())
            elif isinstance(value, str) and value.strip():
                interests.add(value.strip())

        return success_response(sorted(interests), 'Interested field options retrieved successfully', 200)

    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)


@analytics_bp.route('/placement/package-stats', methods=['GET'])
@jwt_required()
def get_package_statistics():
    """
    Get package statistics (highest/average) for all years and last year
    
    Filters:
        - Only considers records where placed_status = True
        - Only considers records where package_lpa IS NOT null
    
    Returns:
        - highestAllYears: Max package across all valid records
        - averageAllYears: Average package across all valid records
        - highestLastYear: Max package in the latest placement year
        - averageLastYear: Average package in the latest placement year
    """
    try:
        db = current_app.mongo_db
        
        # Step 1: Filter valid records (placed = true AND package_lpa IS NOT null)
        valid_records_pipeline = [
            {
                '$match': {
                    'placed_status': True,
                    'package_lpa': {'$ne': None, '$exists': True, '$type': 'double'}
                }
            },
            {
                '$facet': {
                    # All years statistics
                    'all_years': [
                        {
                            '$group': {
                                '_id': None,
                                'highest': {'$max': '$package_lpa'},
                                'average': {'$avg': '$package_lpa'},
                                'count': {'$sum': 1}
                            }
                        },
                        {
                            '$project': {
                                '_id': 0,
                                'highest': 1,
                                'average': {'$round': ['$average', 2]},
                                'count': 1
                            }
                        }
                    ],
                    # Get latest year
                    'latest_year': [
                        {
                            '$group': {
                                '_id': None,
                                'max_year': {'$max': '$placement_year'}
                            }
                        },
                        {
                            '$project': {
                                '_id': 0,
                                'max_year': 1
                            }
                        }
                    ]
                }
            }
        ]
        
        result = list(db.placement_records.aggregate(valid_records_pipeline))
        
        if not result:
            return success_response({
                'highestAllYears': None,
                'averageAllYears': None,
                'highestLastYear': None,
                'averageLastYear': None
            }, 'No placement records available', 200)
        
        # Extract all years data
        all_years_data = result[0].get('all_years', [])
        latest_year_data = result[0].get('latest_year', [])
        
        highest_all_years = None
        average_all_years = None
        
        if all_years_data and len(all_years_data) > 0:
            all_years_stats = all_years_data[0]
            highest_all_years = all_years_stats.get('highest')
            average_all_years = all_years_stats.get('average')
        
        # Get latest year if available
        latest_year = None
        if latest_year_data and len(latest_year_data) > 0:
            latest_year = latest_year_data[0].get('max_year')
        
        # Step 2: Get highest and average for latest year only
        highest_last_year = None
        average_last_year = None
        
        if latest_year:
            last_year_pipeline = [
                {
                    '$match': {
                        'placed_status': True,
                        'package_lpa': {'$ne': None, '$exists': True, '$type': 'double'},
                        'placement_year': latest_year
                    }
                },
                {
                    '$group': {
                        '_id': None,
                        'highest': {'$max': '$package_lpa'},
                        'average': {'$avg': '$package_lpa'},
                        'count': {'$sum': 1}
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'highest': 1,
                        'average': {'$round': ['$average', 2]},
                        'count': 1
                    }
                }
            ]
            
            last_year_result = list(db.placement_records.aggregate(last_year_pipeline))
            
            if last_year_result and len(last_year_result) > 0:
                last_year_stats = last_year_result[0]
                highest_last_year = last_year_stats.get('highest')
                average_last_year = last_year_stats.get('average')
        
        return success_response({
            'highestAllYears': highest_all_years,
            'averageAllYears': average_all_years,
            'highestLastYear': highest_last_year,
            'averageLastYear': average_last_year
        }, 'Package statistics retrieved successfully', 200)
        
    except PyMongoError as e:
        return error_response(f'Database error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)
