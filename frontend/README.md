# Placement Trend & Skill Demand Analyzer - Frontend

A modern React dashboard for students and TPO officers to analyze placement trends and skill demands.

## Setup Instructions

### 1. Prerequisites
- Node.js 16+ and npm
- npm or yarn package manager

### 2. Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### 3. Configure Backend URL

The frontend is configured to connect to backend at `http://localhost:5000`.
If your backend runs on a different URL, update the proxy in `vite.config.js`:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  }
}
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at: `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

## Features

### Student Dashboard
- View academic profile (CGPA, Branch, Backlogs)
- Edit career interests and skills
- View placement trends (year-wise and branch-wise)
- Analyze top demanded skills
- Check placement status

### Student Pages
1. **Dashboard** - Overview of academic info
2. **Profile** - Detailed profile with editable fields
3. **Placement Trends** - Charts and analytics
4. **Skill Demand** - Top skills in market

### TPO Dashboard
- View department statistics
- Monitor placement records
- Analyze top recruiting companies
- Student management view
- Branch-wise placement analysis

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── StudentProfile.jsx
│   │   ├── PlacementTrend.jsx
│   │   ├── SkillDemand.jsx
│   │   └── TPODashboard.jsx
│   ├── components/
│   │   └── Navbar.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   │   └── auth.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Authentication

- JWT-based authentication
- Tokens stored in localStorage
- Automatic logout on token expiration
- Role-based access control (Student/TPO)

## Test Accounts

**Student:**
- Email: arjun.sharma@college.edu
- Password: password123

**TPO:**
- Email: tpo.cse@college.edu
- Password: tpo123

## Technologies Used

- **React 18** - UI library
- **React Router 6** - Navigation
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool

## Styling

The project uses Tailwind CSS for responsive design. Custom styles are in `src/index.css`.

### Color Scheme
- Primary: `#2563eb` (Blue)
- Secondary: `#1e40af` (Dark Blue)
- Accent: `#f59e0b` (Amber)

## API Integration

All API calls are handled through `src/services/api.js` with an axios instance.
Authentication token is automatically included in request headers.

### Example API Call
```javascript
import { studentService } from './services/api';

const profile = await studentService.getProfile();
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Lazy loading of routes
- Optimized bundle size
- Efficient data fetching
- Responsive design

## Notes

- Ensure backend is running before starting frontend
- Check browser console for detailed error messages
- Use React DevTools for debugging
- Network requests visible in DevTools Network tab

## Troubleshooting

**Issue: "Cannot POST /api/auth/login"**
- Ensure backend server is running on port 5000
- Check MONGODB_URI in backend .env file

**Issue: "Token invalid or expired"**
- Clear localStorage and login again
- Check JWT_SECRET_KEY matches in backend config

**Issue: Styles not loading**
- Clear browser cache
- Run `npm install` again to ensure all dependencies loaded
