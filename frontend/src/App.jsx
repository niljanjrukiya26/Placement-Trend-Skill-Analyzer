/**
 * Main React Application Component
 * Sets up routing and handles authentication redirects
 */
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authUtils } from './utils/auth';
import { normalizeRole, ROLES } from './utils/tpo/roles';
import './index.css';

// Pages
import LoginPage from './pages/LoginPage';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import PlacementTrend from './pages/PlacementTrend';
import DomainListPage from './pages/DomainListPage';
import DomainDetailsPage from './pages/DomainDetailsPage';
import PlacementInsights from './pages/PlacementInsights';
import SkillGap from './pages/SkillGap';
import PlacementPrediction from './pages/PlacementPrediction';
import Dashboard from './pages/tpo/Dashboard';
import ManageTPO from './pages/tpo/ManageTPO';
import ManageCompany from './pages/tpo/ManageCompany';
import ManageDomain from './pages/tpo/ManageDomain';
import ManagePlacementRecords from './pages/tpo/ManagePlacementRecords';
import ManageStudents from './pages/tpo/ManageStudents';
import Leaderboard from './pages/tpo/Leaderboard';
import PlacementDashboard from './pages/tpo/PlacementDashboard';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children, allowedRoles = null }) {
  const isAuthenticated = authUtils.isAuthenticated();
  const userRole = normalizeRole(authUtils.getUserRole());

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
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
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-profile"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement-trend"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <PlacementTrend />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-demand"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <DomainListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/domain-skills/:domainName"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <DomainDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement-insights/:jobRole"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <PlacementInsights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-gap"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <SkillGap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement-prediction"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <PlacementPrediction />
            </ProtectedRoute>
          }
        />

        {/* TPO Routes */}
        <Route
          path="/tpo/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAIN_TPO, ROLES.BRANCH_TPO]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tpo/manage-tpo"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAIN_TPO]}>
              <ManageTPO />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tpo/manage-company"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAIN_TPO]}>
              <ManageCompany />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tpo/manage-job-role"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAIN_TPO]}>
              <ManageDomain />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tpo/manage-placement-records"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAIN_TPO, ROLES.BRANCH_TPO]}>
              <ManagePlacementRecords />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tpo/manage-students"
          element={
            <ProtectedRoute allowedRoles={[ROLES.BRANCH_TPO]}>
              <ManageStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tpo/leaderboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAIN_TPO, ROLES.BRANCH_TPO]}>
              <Leaderboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tpo/placements-dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAIN_TPO, ROLES.BRANCH_TPO]}>
              <PlacementDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/tpo/manage-domain" element={<Navigate to="/tpo/manage-job-role" replace />} />
        <Route path="/tpo/placement-records" element={<Navigate to="/tpo/manage-placement-records" replace />} />
        <Route path="/tpo/students" element={<Navigate to="/tpo/manage-students" replace />} />
        <Route path="/tpo/rankings" element={<Navigate to="/tpo/leaderboard" replace />} />

        <Route path="/tpo" element={<Navigate to="/tpo/dashboard" replace />} />

        <Route path="/tpo/*" element={<Navigate to="/tpo/dashboard" replace />} />

        <Route path="/tpo-dashboard" element={<Navigate to="/tpo/dashboard" replace />} />

        {/* Default Route */}
        <Route
          path="/"
          element={
            authUtils.isAuthenticated() ? (
              normalizeRole(authUtils.getUserRole()) === 'Student' ? (
                <Navigate to="/student-dashboard" replace />
              ) : (
                <Navigate to="/tpo/dashboard" replace />
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
