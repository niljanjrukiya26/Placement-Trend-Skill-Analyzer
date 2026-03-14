/**
 * Main React Application Component
 * Sets up routing and handles authentication redirects
 */
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authUtils } from './utils/auth';
import './index.css';

// Pages
import LoginPage from './pages/LoginPage';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import PlacementTrend from './pages/PlacementTrend';
import DomainListPage from './pages/DomainListPage';
import DomainDetailsPage from './pages/DomainDetailsPage';
import TPODashboard from './pages/TPODashboard';
import ComingSoon from './components/ComingSoon';
import SkillGap from './pages/SkillGap';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children, requiredRole = null }) {
  const isAuthenticated = authUtils.isAuthenticated();
  const userRole = authUtils.getUserRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize app
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Student Routes */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute requiredRole="Student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-profile"
          element={
            <ProtectedRoute requiredRole="Student">
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement-trend"
          element={
            <ProtectedRoute requiredRole="Student">
              <PlacementTrend />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-demand"
          element={
            <ProtectedRoute requiredRole="Student">
              <DomainListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/domain-skills/:domainName"
          element={
            <ProtectedRoute requiredRole="Student">
              <DomainDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-gap"
          element={
            <ProtectedRoute requiredRole="Student">
              <SkillGap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement-prediction"
          element={
            <ProtectedRoute requiredRole="Student">
              <ComingSoon 
                title="Placement Prediction & Company Compatibility" 
                description="Get AI-powered predictions on your placement chances and discover companies that match your profile. Coming in Phase 2!"
              />
            </ProtectedRoute>
          }
        />

        {/* TPO Routes */}
        <Route
          path="/tpo-dashboard"
          element={
            <ProtectedRoute requiredRole="TPO">
              <TPODashboard />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route
          path="/"
          element={
            authUtils.isAuthenticated() ? (
              authUtils.getUserRole() === 'Student' ? (
                <Navigate to="/student-dashboard" replace />
              ) : (
                <Navigate to="/tpo-dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
