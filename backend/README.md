# Placement Trend & Skill Demand Analyzer - Backend
# Flask REST API Server

This is the backend service for the Placement Trend & Skill Demand Analyzer application.

## Setup Instructions

### 1. Prerequisites
- Python 3.8+
- MongoDB (local or cloud instance)
- pip (Python package manager)

### 2. Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Edit `.env` file with your settings:
```
FLASK_ENV=development
FLASK_DEBUG=True
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
MONGODB_URI=mongodb://localhost:27017
DB_NAME=placement_analyzer
```

### 4. Prepare Database

Run the MongoDB seed script to populate sample data:
```bash
python seed_db.py
```

This will create all collections and insert test data.

### 5. Run the Server

```bash
python run.py
```

The API will be available at: `http://localhost:5000`

## API Endpoints

### Authentication
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/logout` - User logout
- **GET** `/api/auth/validate-token` - Validate JWT token

### Student APIs
- **GET** `/api/student/profile` - Get student profile
- **PUT** `/api/student/profile` - Update student profile
- **GET** `/api/student/placement-status` - Get placement status

### Analytics APIs
- **GET** `/api/analytics/placement/yearwise` - Year-wise placement stats
- **GET** `/api/analytics/placement/branchwise` - Branch-wise placement stats
- **GET** `/api/analytics/skills/top` - Top demanded skills
- **GET** `/api/analytics/companies/overview` - Companies overview

### TPO APIs
- **GET** `/api/tpo/profile` - Get TPO profile
- **GET** `/api/tpo/students` - Get branch students
- **GET** `/api/tpo/placement-records` - Get placement records
- **GET** `/api/tpo/branch-statistics` - Get branch statistics

## Database Schema

### Collections

**users**
```json
{
  "userid": "STU001",
  "email": "student@college.edu",
  "password": "hashed_password",
  "role": "Student"
}
```

**students**
```json
{
  "userid": "STU001",
  "student_id": "CSE2019001",
  "branch": "CSE",
  "cgpa": 8.5,
  "backlogs": 0,
  "interested_field": "Web Development",
  "skills": ["python", "javascript", "react"]
}
```

**placement_records**
```json
{
  "student_id": "CSE2019001",
  "branch": "CSE",
  "placement_year": 2023,
  "placed_status": true,
  "company_name": "Google",
  "job_role": "Software Engineer",
  "package_lpa": 15.0
}
```

## Test Credentials

Student Account:
- Email: arjun.sharma@college.edu
- Password: password123

TPO Account:
- Email: tpo.cse@college.edu
- Password: tpo123

## Project Structure

```
backend/
├── app/
│   ├── auth/          # Authentication routes
│   ├── student/       # Student routes
│   ├── analytics/     # Analytics routes
│   ├── tpo/          # TPO routes
│   ├── __init__.py    # App factory
│   ├── utils.py       # Utility functions
│   └── constants.py   # Constants
├── config.py          # Configuration
├── run.py            # Entry point
├── seed_db.py        # Database seed script
└── requirements.txt  # Python dependencies
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-02-10T10:30:00"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "timestamp": "2024-02-10T10:30:00"
}
```

## Testing

Use tools like Postman or curl to test endpoints:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun.sharma@college.edu","password":"password123"}'

# Get student profile (requires token)
curl -X GET http://localhost:5000/api/student/profile \
  -H "Authorization: Bearer <your_token>"
```

## Notes

- All endpoints except login require JWT authentication
- JWT tokens are valid for 24 hours
- In production, use HTTPS and update JWT_SECRET_KEY
- Use proper password hashing in production
- Implement rate limiting for API endpoints
