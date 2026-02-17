# Placement Trend & Skill Demand Analyzer

A full-stack web application for analyzing placement trends and skill demands in educational institutions. This 30% MVP provides core functionality for students and TPO officers.

## 📋 Project Overview

**Status:** 30% Working MVP  
**Version:** 1.0.0  
**Last Updated:** February 2024

This application helps:
- **Students**: Track placement trends, analyze skill demands, and understand job market requirements
- **TPO Officers**: Monitor placement statistics, track student placements, and analyze branch performance

## 🏗️ Technology Stack

### Backend
- **Framework**: Flask 2.3.3
- **Language**: Python 3.8+
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful APIs with JSON

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Icons**: Lucide React

## 📦 Project Structure

```
project/
├── backend/                      # Flask REST API
│   ├── app/
│   │   ├── auth/                # Authentication endpoints
│   │   ├── student/             # Student endpoints
│   │   ├── analytics/           # Analytics endpoints
│   │   ├── tpo/                 # TPO endpoints
│   │   ├── __init__.py          # App factory
│   │   ├── utils.py             # Utility functions
│   │   └── constants.py         # Constants
│   ├── config.py                # Configuration
│   ├── run.py                   # Entry point
│   ├── seed_db.py              # Database seeding
│   ├── requirements.txt         # Dependencies
│   └── README.md                # Backend docs
│
└── frontend/                     # React Application
    ├── src/
    │   ├── pages/              # Page components
    │   ├── components/         # Reusable components
    │   ├── services/           # API client
    │   ├── utils/              # Utilities
    │   ├── App.jsx             # Main component
    │   ├── main.jsx            # Entry point
    │   └── index.css           # Global styles
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── README.md               # Frontend docs
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment (optional)
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate (Windows)

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure MongoDB connection in .env
# Update MONGODB_URI if needed (default: mongodb://localhost:27017)

# 5. Seed database with sample data
python seed_db.py

# 6. Start the server
python run.py
```

Backend will run on: `http://localhost:5000`

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Frontend will run on: `http://localhost:3000`

## 🔐 Test Credentials

### Student Account
```
Email: arjun.sharma@college.edu
Password: password123
```

### TPO Account
```
Email: tpo.cse@college.edu
Password: tpo123
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Student APIs (JWT Required)
- `GET /api/student/profile` - Get student profile
- `PUT /api/student/profile` - Update profile
- `GET /api/student/placement-status` - Get placement status

### Analytics APIs (JWT Required)
- `GET /api/analytics/placement/yearwise` - Year-wise stats
- `GET /api/analytics/placement/branchwise?year=YYYY` - Branch-wise stats
- `GET /api/analytics/skills/top?limit=10` - Top skills
- `GET /api/analytics/companies/overview` - Companies list

### TPO APIs (JWT + TPO Role Required)
- `GET /api/tpo/profile` - Get TPO profile
- `GET /api/tpo/students` - Get branch students
- `GET /api/tpo/placement-records?year=YYYY` - Placement records
- `GET /api/tpo/branch-statistics` - Branch statistics

## 📱 Features Implemented (30% MVP)

### ✅ Completed Features

**Authentication**
- JWT-based login
- Role-based access control (Student/TPO)
- Secure token storage

**Student Features**
- View academic profile
- Update career interests and skills
- View placement trends
- Analyze skill demand
- Check placement status

**Analytics**
- Year-wise placement statistics
- Branch-wise placement analysis
- Top demanded skills
- Company overview

**TPO Features**
- View branch statistics
- Monitor student placements
- Analyze placement records
- View top recruiting companies

**UI/UX**
- Responsive design with Tailwind CSS
- Interactive charts with Recharts
- Clean card-based layout
- Professional color scheme

### ❌ Not Included (Future 70%)

- ML/AI-based predictions
- Resume analysis
- Job matching algorithms
- Email notifications
- Advanced filtering and search
- Data export features
- Admin dashboard
- Student eligibility matching

## 🔋 Database Collections

```javascript
// users - Authentication
{ userid, email, password, role }

// students - Student profiles
{ userid, student_id, branch, cgpa, backlogs, interested_field, skills[] }

// placement_records - Placement outcomes
{ student_id, branch, cgpa, placement_year, placed_status, company_name, job_role, package_lpa }

// companies - Company info
{ company_id, company_name, job_roles[], required_cgpa, minimum_pkg, max_pkg, year }

// job_roles - Job templates
{ job_role_id, job_role, required_skills[], eligible_branches[] }

// tpo - TPO info
{ userid, tpo_id, tpo_name, branch }
```

## 🛠️ Configuration

### Backend (.env)
```
FLASK_ENV=development
JWT_SECRET_KEY=your-secret-key
MONGODB_URI=mongodb://localhost:27017
DB_NAME=placement_analyzer
```

### Frontend (vite.config.js)
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```

## 📊 Sample Data

The database is pre-populated with:
- 5 student accounts
- 2 TPO accounts
- 6 placement records
- 4 companies
- 7 job roles
- Complete skill requirements

## 🧪 Testing

### Using Postman/curl

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun.sharma@college.edu","password":"password123"}'

# Get profile (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/student/profile \
  -H "Authorization: Bearer TOKEN"
```

### Browser Testing
1. Go to http://localhost:3000
2. Login with test credentials
3. Navigate through all pages
4. Check console for errors (F12)

## 📝 Code Quality

- Clean, readable code with comments
- Modular architecture
- Separation of concerns
- Error handling with informative messages
- Consistent naming conventions
- Proper logging for debugging

## 🔒 Security Considerations (MVP)

⚠️ **Production Checklist:**
- [ ] Use HTTPS instead of HTTP
- [ ] Hash passwords with bcrypt
- [ ] Implement CSRF protection
- [ ] Add rate limiting
- [ ] Update JWT_SECRET_KEY
- [ ] Add request validation
- [ ] Implement CORS properly
- [ ] Add logging and monitoring
- [ ] Database backup strategy
- [ ] Error handling improvements

## 💡 Key Implementation Details

### JWT Flow
1. User logs in with email/password
2. Backend validates and generates JWT token
3. Token stored in localStorage
4. Token automatically added to API requests
5. Token validated on every protected endpoint
6. Automatic logout on token expiration

### MongoDB Aggregation
- Used for placement statistics
- Year-wise grouping and counting
- Branch-wise analysis
- Skill frequency aggregation

### Responsive Design
- Mobile-first approach
- Tailwind CSS utilities
- Grid and flexbox layouts
- Touch-friendly components

## 📈 Performance Optimizations

- Lazy loading routes
- Optimized images and assets
- Efficient API calls
- Caching with axios interceptors
- Minimal re-renders

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot connect to MongoDB" | Ensure MongoDB is running, check MONGODB_URI |
| "Backend not responding" | Check if server running on port 5000 |
| "CORS errors" | Verify CORS configuration in Flask |
| "JWT invalid" | Clear localStorage and login again |
| "Blank dashboard" | Check network tab for API errors |

## 📚 Documentation

- [Backend README](./backend/README.md) - API documentation
- [Frontend README](./frontend/README.md) - UI documentation
- Code comments throughout the project

## 🤝 Contributing

For future development:
1. Follow existing code structure
2. Add comprehensive comments
3. Test thoroughly before committing
4. Update documentation
5. Use meaningful commit messages

## 📄 License

This project is for educational purposes.

---

**Ready to extend?** Check out the [Future Features List](#-not-included-future-70%) for ideas on completing the remaining 70% of the application.

For questions or issues, refer to the individual README files in backend/ and frontend/ directories.
