# Placement Trend & Skill Demand Analyzer

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-MVP-yellow)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![Node.js](https://img.shields.io/badge/Node.js-16+-green)

A comprehensive full-stack web application for analyzing placement trends, skill demands, and providing AI-powered placement predictions in educational institutions. The system serves students, TPO (Training & Placement Officers), and administrators with data-driven insights for career planning and institutional placement management.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Machine Learning Models](#machine-learning-models)
- [Feature Modules](#feature-modules)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 📚 Overview

### Project Vision
Empower students and educational institutions with actionable insights about placement trends and skill market demands. The application bridges the gap between academic preparation and industry requirements through:

- **Real-time Analytics**: Year-wise and branch-wise placement statistics
- **Skill Gap Analysis**: Identify gaps between student skills and market demands
- **Predictive Intelligence**: ML-based placement predictions for students
- **Institutional Management**: Comprehensive TPO tools for placement tracking
- **Job Market Intelligence**: Top companies, domains, and job roles analysis

### Project Status
- **Current Version**: 1.0.0
- **Status**: 30% Working MVP
- **Last Updated**: February 2024

### Target Users
1. **Students** - Track placement opportunities, analyze market trends, skill development
2. **TPO Officers** - Manage placements, monitor statistics, institutional oversight
3. **Administrators** - System configuration, data management, user administration

---

## 🎯 Key Features

### Student Features
| Feature | Description |
|---------|-------------|
| **Authentication** | Secure JWT-based login with role-based access |
| **Student Dashboard** | Overview of academic profile, placement status, and key metrics |
| **Student Profile** | Detailed academic information (CGPA, Branch, Backlogs) with editing capabilities |
| **Placement Trends** | Interactive charts showing year-wise and branch-wise placement statistics |
| **Skill Demand Analysis** | Identify top 10 in-demand skills in the job market |
| **Skill Gap Assessment** | Compare current skills with market demands and get recommendations |
| **Placement Prediction** | AI-powered prediction of placement probability based on academic profile |
| **Domain Exploration** | Browse technical domains, job roles, and company insights |
| **Placement Insights** | Company-wise placement data, salary ranges, and domain distribution |

### TPO Officer Features
| Feature | Description |
|---------|-------------|
| **TPO Dashboard** | Department-wide statistics, placement overview, key metrics |
| **Student Management** | Search, filter, and manage student records; view academic profiles |
| **Placement Records** | View, update, and manage student placement outcomes |
| **Company Management** | Register companies, manage recruitment patterns, track engagement |
| **Domain Management** | Configure technical domains and job role templates |
| **Analytics Dashboard** | Branch-wise performance, placement rates, company rankings |
| **Leaderboard** | Rank students based on placement success and performance metrics |
| **Placement Planning** | Microplanning tools for strategic placement initiatives |

### System Features
| Feature | Description |
|---------|-------------|
| **Multi-role Authentication** | Support for Students, TPO Officers, Branch TPO, Main TPO roles |
| **Real-time API** | RESTful API with comprehensive endpoints for all operations |
| **Data Visualization** | Interactive charts and graphs using Recharts and ApexCharts |
| **Responsive UI** | Mobile-friendly design with Tailwind CSS |
| **ML Integration** | Random Forest classifier for placement predictions |
| **CORS Support** | Secure cross-origin requests for frontend-backend communication |
| **MongoDB Integration** | Scalable NoSQL database with optimized query patterns |

---

## 🛠️ Technology Stack

### Backend
```
Framework:           Flask 2.3.3
Language:            Python 3.8+
Database:            MongoDB
Authentication:      JWT (JSON Web Tokens)
ML Library:          scikit-learn (Random Forest Classifier)
Data Processing:     pandas
Server:              Werkzeug
API Style:           RESTful JSON APIs
```

**Backend Dependencies:**
- `Flask==2.3.3` - Web framework
- `Flask-JWT-Extended==4.5.2` - JWT authentication
- `Flask-CORS==4.0.0` - Cross-Origin Resource Sharing
- `pymongo==4.5.0` - MongoDB driver
- `python-dotenv==1.0.0` - Environment configuration
- `requests==2.32.3` - HTTP library
- `pandas==2.2.3` - Data manipulation
- `scikit-learn==1.5.2` - Machine learning

### Frontend
```
Framework:           React 18
Language:            JavaScript (JSX)
Styling:             Tailwind CSS 3.3
Routing:             React Router v6
Build Tool:          Vite 7.3.1
HTTP Client:         Axios
Charts:              Recharts 2.10.0, ApexCharts 5.3.6
Icons:               Lucide React 0.263.1
Animations:          Framer Motion 12.34.0
```

**Frontend Dependencies:**
- `react@^18.2.0` - UI library
- `react-router-dom@^6.15.0` - Routing
- `axios@^1.5.0` - API client
- `recharts@^2.10.0` - Interactive charts
- `lucide-react@^0.263.1` - Icon library
- `tailwindcss@^3.3.0` - Utility CSS
- `vite@^7.3.1` - Build and dev server

### Infrastructure & Tools
| Tool | Purpose |
|------|---------|
| **MongoDB** | NoSQL database for flexible data storage |
| **Docker** | Containerization (optional) |
| **Git** | Version control |
| **npm/Yarn** | Frontend package management |
| **pip** | Python package management |

---

## 📁 Project Structure

```
project/
│
├── 📄 README.md                          # Main project documentation
├── 📄 README_NEW.md                      # Comprehensive project documentation
│
├── 📂 backend/                           # Flask REST API Server
│   ├── 📄 run.py                         # Application entry point
│   ├── 📄 config.py                      # Flask configuration (Dev/Prod)
│   ├── 📄 app.py                         # Quick app reference
│   ├── 📄 requirements.txt               # Python dependencies
│   ├── 📄 README.md                      # Backend documentation
│   ├── 📄 migrate_tpo_collection.py      # Database migration script
│   │
│   ├── 📂 app/                           # Main application package
│   │   ├── 📄 __init__.py                # App factory function
│   │   ├── 📄 constants.py               # Application constants
│   │   ├── 📄 utils.py                   # Utility functions
│   │   ├── 📄 branch_utils.py            # Branch-related utilities
│   │   ├── 📄 score_utils.py             # Scoring utilities
│   │   │
│   │   ├── 📂 auth/                      # Authentication module
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 routes.py              # Login, token validation
│   │   │
│   │   ├── 📂 student/                   # Student module
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 routes.py              # Student profile, placement status
│   │   │
│   │   ├── 📂 tpo/                       # TPO Officer module
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 routes.py              # TPO profile, students, statistics
│   │   │
│   │   ├── 📂 analytics/                 # Analytics module
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 routes.py              # Placement & skill analytics
│   │   │
│   │   ├── 📂 company/                   # Company module
│   │   │   └── 📄 routes.py              # Company management
│   │   │
│   │   ├── 📂 domain/                    # Domain module
│   │   │   └── 📄 routes.py              # Technical domain management
│   │   │
│   │   ├── 📂 skillgap/                  # Skill Gap Analysis
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 routes.py              # Skill gap endpoints
│   │   │   └── 📄 services.py            # Skill gap logic
│   │   │
│   │   ├── 📂 microplan/                 # Placement Planning
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 routes.py              # Microplanning endpoints
│   │   │
│   │   ├── 📂 placements/                # Placement Records
│   │   │   └── 📄 routes.py              # Placement data endpoints
│   │   │
│   │   ├── 📂 routes/                    # API routing
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 prediction_routes.py   # Placement prediction endpoints
│   │   │
│   │   ├── 📂 services/                  # Business logic layer
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 prediction_service.py  # ML prediction service
│   │   │
│   │   └── 📂 models/                    # (Empty - ready for models)
│   │
│   ├── 📂 placement_ml/                  # Machine Learning Module
│   │   ├── 📄 train_model.py             # Model training script
│   │   ├── 📄 placement_model.pkl        # Trained model (binary)
│   │   └── 📄 domain_encoder.pkl         # Domain encoder (binary)
│   │
│   ├── 📂 static/                        # Static assets
│   │   └── 📂 js/
│   │       └── 📄 placement_prediction.js
│   │
│   └── 📂 templates/                     # HTML templates
│       └── 📄 placement_prediction.html
│
├── 📂 frontend/                          # React SPA Application
│   ├── 📄 package.json                   # NPM dependencies & scripts
│   ├── 📄 vite.config.js                 # Vite configuration
│   ├── 📄 tailwind.config.js             # Tailwind CSS config
│   ├── 📄 postcss.config.js              # PostCSS plugins
│   ├── 📄 index.html                     # HTML entry point
│   ├── 📄 README.md                      # Frontend documentation
│   │
│   └── 📂 src/                           # React source code
│       ├── 📄 main.jsx                   # React app entry
│       ├── 📄 App.jsx                    # Main router component
│       ├── 📄 index.css                  # Global styles
│       │
│       ├── 📂 pages/                     # Page components
│       │   ├── 📄 LoginPage.jsx          # Authentication page
│       │   ├── 📄 ForgotPassword.jsx     # Password recovery
│       │   ├── 📄 StudentDashboard.jsx   # Student home
│       │   ├── 📄 StudentProfile.jsx     # Student profile
│       │   ├── 📄 PlacementTrend.jsx     # Trend analysis
│       │   ├── 📄 SkillDemand.jsx        # Skill analysis
│       │   ├── 📄 SkillGap.jsx           # Skill gap assessment
│       │   ├── 📄 PlacementPrediction.jsx # Placement prediction
│       │   ├── 📄 PlacementInsights.jsx  # Company & placement data
│       │   ├── 📄 DomainListPage.jsx     # Domain listing
│       │   ├── 📄 DomainDetailsPage.jsx  # Domain details
│       │   └── 📂 tpo/                   # TPO pages
│       │       ├── 📄 Dashboard.jsx
│       │       ├── 📄 PlacementDashboard.jsx
│       │       ├── 📄 ManageStudents.jsx
│       │       ├── 📄 ManageCompany.jsx
│       │       ├── 📄 ManageDomain.jsx
│       │       ├── 📄 ManagePlacementRecords.jsx
│       │       ├── 📄 ManageTPO.jsx
│       │       ├── 📄 Leaderboard.jsx
│       │       └── 📄 PlacementPage.jsx
│       │
│       ├── 📂 components/                # Reusable components
│       │   ├── 📄 Sidebar.jsx            # Navigation sidebar
│       │   ├── 📄 CircularProgress.jsx   # Progress indicator
│       │   ├── 📄 ComingSoon.jsx         # Placeholder component
│       │   └── 📂 tpo/                   # TPO components
│       │       ├── 📄 TPOLayout.jsx
│       │       ├── 📄 StatCard.jsx
│       │       ├── 📄 Chart.jsx
│       │       ├── 📄 Table.jsx
│       │       ├── 📄 PlacementTable.jsx
│       │       ├── 📄 Card.jsx
│       │       ├── 📄 LoadingSkeleton.jsx
│       │       ├── 📄 EmptyState.jsx
│       │       └── 📄 AccessDenied.jsx
│       │
│       ├── 📂 services/                  # API communication
│       │   └── 📄 api.js                 # Axios API client
│       │
│       ├── 📂 utils/                     # Utility functions
│       │   ├── 📄 auth.js                # Authentication utilities
│       │   ├── 📄 branch.js              # Branch utilities
│       │   ├── 📄 domain.js              # Domain utilities
│       │   └── 📂 tpo/                   # TPO utilities
│       │       ├── 📄 roles.js           # Role normalization
│       │       └── 📄 dataSelectors.js   # Data selection helpers
│       │
│       ├── 📂 hooks/                     # React custom hooks (future)
│       │
│       └── 📂 data/                      # Mock data
│           └── 📄 tpoMockData.js         # Sample TPO data
```

---

## 📋 Prerequisites

### System Requirements
- **Minimum RAM**: 2GB
- **Storage**: 500MB (without node_modules and venv)
- **OS**: Windows, macOS, or Linux

### Software Requirements

#### Backend Requirements
- **Python**: 3.8 or higher
  ```bash
  # Check Python version
  python --version
  ```
- **MongoDB**: 4.4 or higher (Local or Atlas Cloud)
  - Local: [Download MongoDB Community](https://www.mongodb.com/try/download/community)
  - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **pip**: Python package manager (usually included with Python)

#### Frontend Requirements
- **Node.js**: 16.0.0 or higher
  ```bash
  # Check Node version
  node --version
  ```
- **npm**: 7.0.0 or higher (included with Node.js)
  ```bash
  # Check npm version
  npm --version
  ```

### Optional Tools
- **Git**: Version control
- **Postman**: API testing
- **Visual Studio Code**: Code editor

---

## 🚀 Installation & Setup

### Step 1: Clone/Download the Project

```bash
# Clone the repository
git clone <repository-url>
cd project
```

### Step 2: Backend Setup

#### 2.1 Create Python Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### 2.2 Install Backend Dependencies

```bash
# Install required packages
pip install -r requirements.txt
```

**Expected output:** All packages installed successfully with no errors.

#### 2.3 Configure Backend Environment

Create a `.env` file in the `backend` directory:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DB_NAME=placement_trend_skill_db
```

**Important**: For production, use a strong JWT secret key and secure MongoDB connection.

#### 2.4 Initialize Database (Optional)

```bash
# Run migration script (if needed)
python migrate_tpo_collection.py

# Train ML model (one-time setup)
python -c "
from app import create_app
from placement_ml.train_model import train_and_save_model
app = create_app()
with app.app_context():
    try:
        train_and_save_model(app.mongo_db)
        print('✓ Model trained successfully')
    except Exception as e:
        print(f'Model training skipped: {e}')
"
```

### Step 3: Frontend Setup

#### 3.1 Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd ../frontend

# Install NPM packages
npm install
```

**Expected output:** All packages installed from npm registry.

#### 3.2 Configure Frontend API Connection

Edit or verify `vite.config.js`:

```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
}
```

---

## ⚙️ Configuration

### Backend Configuration

#### MongoDB Connection

**Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=placement_trend_skill_db
```

**MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=placement_trend_skill_db
```

#### JWT Configuration

```env
# Secret key (use strong random string in production)
JWT_SECRET_KEY=your-secret-key-at-least-32-characters

# Token expiry in seconds (default: 86400 = 24 hours)
JWT_ACCESS_TOKEN_EXPIRES=86400
```

#### Flask Configuration

```env
FLASK_ENV=development  # or production
FLASK_DEBUG=True       # Set to False in production
```

### Frontend Configuration

#### API Base URL

Update in `src/services/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

#### Proxy Configuration (Vite)

Edit `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

---

## ▶️ Running the Application

### Option 1: Development Mode (Recommended)

#### Terminal 1: Start Backend API

```bash
cd backend

# Activate virtual environment
venv\Scripts\activate  # Windows
# or source venv/bin/activate  # macOS/Linux

# Run Flask server
python run.py
```

**Expected output:**
```
==================================================
Placement Trend Analyzer Backend API
==================================================
Environment: development
Endpoints:
  - POST   /api/auth/login
  - GET    /api/student/profile
  - GET    /api/analytics/placement/yearwise
  - ...
==================================================

 * Running on http://0.0.0.0:5000
```

#### Terminal 2: Start Frontend Dev Server

```bash
cd frontend

# Start development server
npm run dev
```

**Expected output:**
```
VITE v7.3.1  ready in 123 ms

➜  Local:   http://localhost:5173
➜  press h to show help
```

#### Open Application

Navigate to: `http://localhost:5173`

### Option 2: Production Build

#### Build Frontend

```bash
cd frontend
npm run build
```

This creates a `dist/` folder with optimized production build.

#### Run Backend in Production

```bash
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

---

## 📡 API Documentation

### Authentication Endpoints

#### 1. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "student@example.com or STU001",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_id": "STU001",
  "role": "Student"
}
```

#### 2. Validate Token
```http
GET /api/auth/validate-token
Authorization: Bearer <token>

Response:
{
  "valid": true,
  "user_id": "STU001",
  "role": "Student"
}
```

#### 3. Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

Response:
{
  "message": "Logged out successfully"
}
```

### Student Endpoints

#### 1. Get Student Profile
```http
GET /api/student/profile
Authorization: Bearer <token>

Response:
{
  "userid": "STU001",
  "student_id": "CSE2019001",
  "branch": "CSE",
  "cgpa": 8.5,
  "backlogs": 0,
  "email": "student@college.edu"
}
```

#### 2. Update Student Profile
```http
PUT /api/student/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "cgpa": 8.7,
  "backlogs": 0,
  "skills": ["Python", "JavaScript"]
}

Response:
{
  "message": "Profile updated successfully"
}
```

#### 3. Get Placement Status
```http
GET /api/student/placement-status
Authorization: Bearer <token>

Response:
{
  "placed": true,
  "company": "TCS",
  "package": 5.5,
  "role": "Software Developer"
}
```

### Analytics Endpoints

#### 1. Year-wise Placement Statistics
```http
GET /api/analytics/placement/yearwise
Authorization: Bearer <token>

Response:
{
  "data": [
    {"year": 2023, "placed": 120, "total": 150},
    {"year": 2022, "placed": 110, "total": 140},
    ...
  ]
}
```

#### 2. Branch-wise Placement Statistics
```http
GET /api/analytics/placement/branchwise
Authorization: Bearer <token>

Response:
{
  "data": [
    {"branch": "CSE", "placed": 85, "total": 100},
    {"branch": "ECE", "placed": 60, "total": 80},
    ...
  ]
}
```

#### 3. Top Demanded Skills
```http
GET /api/analytics/skills/top?limit=10
Authorization: Bearer <token>

Response:
{
  "data": [
    {"skill": "Python", "demand": 450},
    {"skill": "JavaScript", "demand": 380},
    ...
  ]
}
```

#### 4. Companies Overview
```http
GET /api/analytics/companies/overview
Authorization: Bearer <token>

Response:
{
  "data": [
    {"name": "TCS", "placements": 45, "avgPackage": 5.2},
    {"name": "Infosys", "placements": 38, "avgPackage": 4.8},
    ...
  ]
}
```

### TPO Endpoints

#### 1. Get TPO Profile
```http
GET /api/tpo/profile
Authorization: Bearer <token>

Response:
{
  "userid": "TPO001",
  "branch": "CSE",
  "role": "BRANCH_TPO",
  "email": "tpo@college.edu"
}
```

#### 2. Get Branch Students
```http
GET /api/tpo/students?branch=CSE&limit=50
Authorization: Bearer <token>

Response:
{
  "data": [
    {"userid": "STU001", "student_id": "CSE2019001", "cgpa": 8.5, ...},
    {"userid": "STU002", "student_id": "CSE2019002", "cgpa": 7.8, ...},
    ...
  ]
}
```

#### 3. Get Placement Records
```http
GET /api/tpo/placement-records?branch=CSE&limit=50
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "student_id": "CSE2019001",
      "company": "TCS",
      "package": 5.5,
      "role": "Software Developer",
      "placed_date": "2023-12-15"
    },
    ...
  ]
}
```

#### 4. Get Branch Statistics
```http
GET /api/tpo/branch-statistics
Authorization: Bearer <token>

Response:
{
  "statistics": {
    "total_students": 100,
    "placed_students": 85,
    "placement_percentage": 85,
    "avg_package": 5.2
  }
}
```

### Placement Prediction Endpoint

#### 1. Predict Placement
```http
POST /api/predict-placement
Authorization: Bearer <token>
Content-Type: application/json

{
  "cgpa": 8.5,
  "backlogs": 0,
  "domain": "CSE"
}

Response:
{
  "prediction": 1,
  "probability": 0.95,
  "message": "High probability of placement"
}
```

### Skill Gap Endpoints

#### 1. Get Skill Gap Analysis
```http
GET /api/skillgap/analysis
Authorization: Bearer <token>

Response:
{
  "student_skills": ["Python", "Java"],
  "market_skills": ["Python", "Java", "JavaScript", "React"],
  "gap_skills": ["JavaScript", "React"],
  "recommendations": [...],
  "gap_percentage": 50
}
```

---

## 🗄️ Database Schema

### MongoDB Collections

#### 1. users Collection
```json
{
  "_id": ObjectId,
  "userid": "STU001",
  "email": "student@college.edu",
  "password": "hashed_password",
  "role": "Student",
  "created_at": ISODate("2024-01-15")
}
```

#### 2. students Collection
```json
{
  "_id": ObjectId,
  "userid": "STU001",
  "student_id": "CSE2019001",
  "name": "John Doe",
  "branch": "CSE",
  "cgpa": 8.5,
  "backlogs": 0,
  "semester": 8,
  "skills": ["Python", "JavaScript"],
  "interests": ["Web Development", "AI/ML"],
  "email": "john@college.edu",
  "phone": "9876543210",
  "updated_at": ISODate("2024-01-15")
}
```

#### 3. placement_records Collection
```json
{
  "_id": ObjectId,
  "student_id": "CSE2019001",
  "userid": "STU001",
  "company": "TCS",
  "package": 5.5,
  "role": "Software Developer",
  "domain": "CSE",
  "placed_status": true,
  "placement_date": ISODate("2023-12-15"),
  "cgpa": 8.5,
  "backlogs": 0
}
```

#### 4. companies Collection
```json
{
  "_id": ObjectId,
  "company_name": "TCS",
  "company_code": "TCS01",
  "headquarters": "Mumbai, India",
  "website": "https://www.tcs.com",
  "recruitment_drives": 5,
  "total_placements": 45,
  "branches_recruited": ["CSE", "ECE", "ME"],
  "average_package": 5.2,
  "average_ctc": "5.2 LPA"
}
```

#### 5. job_roles Collection
```json
{
  "_id": ObjectId,
  "role_name": "Software Developer",
  "role_code": "SDE_001",
  "description": "Develops software applications",
  "required_skills": ["Python", "Java", "JavaScript"],
  "experience_level": "0-2 years",
  "avg_salary": 5.5
}
```

#### 6. domain_job_roles Collection
```json
{
  "_id": ObjectId,
  "domain": "CSE",
  "job_role": "SDE_001",
  "min_cgpa": 7.0,
  "eligible_branches": ["CSE", "IT"],
  "max_backlogs": 0,
  "vacancy": 10
}
```

#### 7. tpo Collection
```json
{
  "_id": ObjectId,
  "userid": "TPO001",
  "name": "Dr. Smith",
  "email": "tpo@college.edu",
  "branch": "CSE",
  "role": "BRANCH_TPO",
  "phone": "9876543210",
  "created_at": ISODate("2024-01-01")
}
```

#### 8. analytics Collection
```json
{
  "_id": ObjectId,
  "metric_type": "branch_placement_rate",
  "branch": "CSE",
  "year": 2023,
  "value": 85,
  "timestamp": ISODate("2024-01-15")
}
```

---

## 🤖 Machine Learning Models

### Placement Prediction Model

**Model Type:** Random Forest Classifier

**Features:**
- CGPA (Student's cumulative GPA, 0-10 scale)
- Backlogs (Number of pending courses)
- Domain (Technical domain: CSE, ECE, ME, etc.)

**Target Variable:**
- Placement Status (0 = Not Placed, 1 = Placed)

**Model Pipeline:**

```python
# Feature extraction from placement records
features = [cgpa, backlogs]
encoded_domain = LabelEncoder.transform(domain)
final_features = [cgpa, backlogs, encoded_domain]

# Training
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Prediction
probability = model.predict_proba([features])[0][1]
prediction = model.predict([features])[0]
```

### Training the Model

#### Automatic Training (First Run)
```bash
cd backend
python -c "
from app import create_app
from placement_ml.train_model import train_and_save_model
app = create_app()
with app.app_context():
    train_and_save_model(app.mongo_db)
    print('✓ Model trained and saved')
"
```

#### Manual Training (After Data Updates)
```bash
cd backend
python placement_ml/train_model.py
```

#### Model Files
- `placement_ml/placement_model.pkl` - Trained Random Forest model
- `placement_ml/domain_encoder.pkl` - Domain label encoder

---

## 🎯 Feature Modules

### 1. Authentication Module
**Location:** `backend/app/auth/`

**Functionality:**
- User login with student ID or email
- JWT token generation and validation
- Role-based access control
- Password verification (supports both hashed and plain-text for legacy data)

**Key Endpoints:**
- `POST /api/auth/login`
- `GET /api/auth/validate-token`
- `POST /api/auth/logout`

---

### 2. Student Module
**Location:** `backend/app/student/`

**Functionality:**
- Student profile management
- Academic information (CGPA, branch, backlogs)
- Placement status tracking
- Skill and interest management

**Key Endpoints:**
- `GET /api/student/profile`
- `PUT /api/student/profile`
- `GET /api/student/placement-status`

---

### 3. TPO Module
**Location:** `backend/app/tpo/`

**Functionality:**
- TPO profile management
- Branch students listing and search
- Placement records management
- Branch statistics and analytics
- Student performance tracking

**Key Endpoints:**
- `GET /api/tpo/profile`
- `GET /api/tpo/students`
- `GET /api/tpo/placement-records`
- `GET /api/tpo/branch-statistics`

---

### 4. Analytics Module
**Location:** `backend/app/analytics/`

**Functionality:**
- Year-wise placement statistics
- Branch-wise placement comparison
- Top in-demand skills analysis
- Company recruitment overview
- Job role insights
- Salary statistics

**Key Endpoints:**
- `GET /api/analytics/placement/yearwise`
- `GET /api/analytics/placement/branchwise`
- `GET /api/analytics/skills/top`
- `GET /api/analytics/companies/overview`

---

### 5. Company Module
**Location:** `backend/app/company/`

**Functionality:**
- Company registration and management
- Recruitment drive tracking
- Company profile information
- Company-wise placement records

**Key Endpoints:**
- `GET /api/company/list`
- `POST /api/company/register`
- `PUT /api/company/update`

---

### 6. Domain Module
**Location:** `backend/app/domain/`

**Functionality:**
- Technical domain management
- Domain-wise job role templates
- Branch eligibility for domains
- Domain skill mapping

**Key Endpoints:**
- `GET /api/domain/list`
- `GET /api/domain/details/<domain_name>`
- `GET /api/domain/job-roles/<domain_name>`

---

### 7. Skill Gap Module
**Location:** `backend/app/skillgap/`

**Functionality:**
- Student skill assessment
- Market skill demand analysis
- Skill gap identification
- Training recommendations
- Learning path suggestions

**Key Endpoints:**
- `GET /api/skillgap/analysis`
- `GET /api/skillgap/recommendations`
- `POST /api/skillgap/update-skills`

---

### 8. Microplan Module
**Location:** `backend/app/microplan/`

**Functionality:**
- Strategic placement planning
- Timeline management
- Initiative tracking
- Target setting and monitoring

**Key Endpoints:**
- `GET /api/microplan/plan`
- `POST /api/microplan/create`
- `PUT /api/microplan/update`

---

### 9. Prediction Module
**Location:** `backend/app/routes/prediction_routes.py`

**Functionality:**
- ML-based placement prediction
- Probability calculation
- Prediction insights
- Improvement recommendations

**Key Endpoints:**
- `POST /api/predict-placement`
- `GET /api/predict-placement/insights`

---

### 10. Placement Records Module
**Location:** `backend/app/placements/`

**Functionality:**
- Placement record creation and management
- Company job role tracking
- Salary and package information
- Placement status updates

**Key Endpoints:**
- `GET /api/placements/records`
- `POST /api/placements/create`
- `PUT /api/placements/update`

---

## 🛠️ Development Guide

### Frontend Development

#### Project Structure
```
frontend/src/
├── pages/          # Full-page components
├── components/     # Reusable components
├── services/       # API integration
├── utils/          # Helper functions
├── hooks/          # React custom hooks
└── data/           # Mock data
```

#### Adding a New Page

1. Create component in `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx`
3. Update navigation in `src/components/Sidebar.jsx`

```jsx
// Example: src/pages/NewPage.jsx
import React from 'react';

export default function NewPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">New Page</h1>
    </div>
  );
}
```

#### Using API Services

```jsx
import { api } from '../services/api';

// GET request
const response = await api.get('/api/student/profile');

// POST request
await api.post('/api/auth/login', {
  identifier: 'student@mail.com',
  password: 'password'
});

// PUT request
await api.put('/api/student/profile', {
  cgpa: 8.5,
  backlogs: 0
});
```

#### Styling with Tailwind CSS

```jsx
// Example: Using Tailwind classes
<div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
  <h2 className="text-xl font-bold mb-2">Title</h2>
  <p className="text-sm">Content here</p>
</div>
```

### Backend Development

#### Project Structure
```
backend/app/
├── auth/           # Authentication routes
├── student/        # Student routes
├── tpo/            # TPO routes
├── analytics/      # Analytics routes
├── services/       # Business logic
├── utils.py        # Helper functions
└── constants.py    # Constants
```

#### Adding a New API Endpoint

1. Create a new blueprint file in respective module directory

```python
# backend/app/new_module/routes.py
from flask import Blueprint, request, current_app
from app.utils import success_response, error_response

new_bp = Blueprint('new', __name__, url_prefix='/api/new')

@new_bp.route('/endpoint', methods=['GET'])
def get_data():
    """Get data endpoint"""
    try:
        db = current_app.mongo_db
        data = db.collection.find_one({})
        return success_response(data), 200
    except Exception as e:
        return error_response(str(e)), 500
```

2. Register blueprint in `app/__init__.py`

```python
from app.new_module.routes import new_bp
app.register_blueprint(new_bp)
```

#### Database Queries

```python
from pymongo import ASCENDING, DESCENDING

db = current_app.mongo_db

# Find one
user = db.users.find_one({'email': email})

# Find many
students = list(db.students.find({'branch': 'CSE'}))

# Insert
db.students.insert_one({'userid': 'STU001', 'cgpa': 8.5})

# Update
db.students.update_one(
    {'userid': 'STU001'},
    {'$set': {'cgpa': 8.7}}
)

# Delete
db.students.delete_one({'userid': 'STU001'})

# Aggregation
pipeline = [
    {'$match': {'branch': 'CSE'}},
    {'$group': {'_id': '$branch', 'count': {'$sum': 1}}}
]
stats = list(db.students.aggregate(pipeline))
```

#### Authentication in Routes

```python
from flask_jwt_extended import jwt_required, get_jwt_identity

@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected_endpoint():
    user_id = get_jwt_identity()
    # Use user_id here
    return {'message': f'Hello {user_id}'}
```

---

## 🐛 Troubleshooting

### Backend Issues

#### Issue: MongoDB Connection Failed
```
Error: Connection refused connecting to 127.0.0.1:27017
```

**Solution:**
1. Ensure MongoDB is running
   - Windows: Start MongoDB service
   - macOS: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

2. Check connection string in `.env`
   ```env
   MONGODB_URI=mongodb://localhost:27017
   ```

3. For MongoDB Atlas:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

---

#### Issue: JWT Token Errors
```
Error: Invalid token / Token has expired
```

**Solution:**
1. Check JWT secret in `.env` is consistent
2. Verify token is being sent in Authorization header:
   ```
   Authorization: Bearer <token>
   ```
3. Restart backend server after changing JWT_SECRET_KEY

---

#### Issue: CORS Errors
```
Error: Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
1. Verify Flask-CORS is enabled in `app/__init__.py`
2. Check frontend API URL matches backend in `vite.config.js`
3. Restart both frontend and backend

---

### Frontend Issues

#### Issue: Blank Page / Nothing Loads
```
Error: Cannot GET /
```

**Solution:**
1. Verify frontend is running: `npm run dev`
2. Check browser console for errors (F12)
3. Clear browser cache and reload
4. Verify `vite.config.js` proxy settings

---

#### Issue: API Calls Failing
```
Error: 404 Not Found / 500 Internal Server Error
```

**Solution:**
1. Verify backend is running on port 5000
2. Check `src/services/api.js` base URL
3. Verify authentication token in request
4. Check backend route implementation
5. Monitor backend console for errors

---

#### Issue: Styling Not Applied (Tailwind)
```
Styles missing even after saving
```

**Solution:**
1. Clear Tailwind cache: `rm -rf node_modules/.cache`
2. Restart dev server: `npm run dev`
3. Verify class names use exact Tailwind syntax
4. Check `tailwind.config.js` content paths

---

### Common Development Issues

#### Issue: Port Already in Use
```
Error: Address already in use :5000 or :3000
```

**Solution:**
```bash
# Find process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :5000
kill -9 <PID>
```

---

#### Issue: Virtual Environment Not Activating
```
Error: Command not found or 'python' not recognized
```

**Solution:**
```bash
# Verify Python installation
python --version

# Use absolute path if needed
/usr/bin/python3 -m venv venv

# Activate from project root
source venv/bin/activate  # or venv\Scripts\activate
```

---

#### Issue: Dependencies Not Found After Install
```
ModuleNotFoundError: No module named 'flask'
```

**Solution:**
1. Verify virtual environment is activated
2. Reinstall dependencies:
   ```bash
   pip install --force-reinstall -r requirements.txt
   ```
3. Check Python version compatibility

---

## 📝 Contributing

### Code Style Guidelines

#### Python (Backend)
- Follow PEP 8 conventions
- Use 4 spaces for indentation
- Add docstrings to functions and classes
- Use type hints where applicable

```python
def calculate_placement_percentage(placed: int, total: int) -> float:
    """
    Calculate placement percentage.
    
    Args:
        placed: Number of placed students
        total: Total number of students
        
    Returns:
        Placement percentage as float
    """
    return (placed / total) * 100 if total > 0 else 0
```

#### JavaScript/React (Frontend)
- Use ES6+ syntax
- Use camelCase for variables and functions
- Use PascalCase for React components
- Add JSDoc comments

```javascript
/**
 * Format student data for display
 * @param {Object} student - Student object
 * @returns {Object} Formatted student data
 */
function formatStudentData(student) {
  return {
    name: student.name || 'N/A',
    cgpa: student.cgpa.toFixed(2)
  };
}
```

### Git Workflow

1. Create a feature branch
   ```bash
   git checkout -b feature/feature-name
   ```

2. Make commits with clear messages
   ```bash
   git commit -m "Add placement prediction feature"
   ```

3. Push to branch
   ```bash
   git push origin feature/feature-name
   ```

4. Create pull request

---

## 📞 Support & Contact

### Getting Help

1. **Check Documentation** - Review README and API docs
2. **Check Issues** - Search existing GitHub issues
3. **Check Logs** - Review browser console and backend logs
4. **Create Issue** - Document error and steps to reproduce

### Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT.io](https://jwt.io/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📄 License

[Add your license here]

---

## 🎊 Project Summary

**Placement Trend & Skill Demand Analyzer** is a data-driven platform designed to bridge the gap between academic education and industry requirements. Through intelligent analytics, ML-based predictions, and comprehensive management tools, the application empowers students for better career planning and institutions for improved placement outcomes.

**Current Status**: MVP (30% Complete)  
**Version**: 1.0.0  
**Last Updated**: February 2024

---

## 🙏 Acknowledgments

Developed as a Mini Project with contributions from:
- Development Team
- Faculty Advisors
- Institutional Support

---

**Happy Learning and Coding! 🚀**
