/**
 * Login Page Component - Modern Landing Page Style
 * Handles user authentication for Student and TPO roles
 * Split layout: LEFT (branding) | RIGHT (login form)
 * Stores JWT token in localStorage on successful login
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { authUtils } from '../utils/auth';
import { normalizeRole } from '../utils/tpo/roles';
import { Lock, Mail, AlertCircle, CheckCircle, Eye, EyeOff, Zap, TrendingUp, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authService.login(identifier, password);
      const {
        access_token,
        user_id,
        role,
        email: userEmail,
        branch,
        must_change_password,
        password_change_token,
      } = response.data.data;

      if (must_change_password) {
        authUtils.clearAuthData();
        authUtils.setPasswordChangeData(password_change_token, userEmail, role);
        setSuccess('Default password detected. Redirecting to password change...');
        setTimeout(() => {
          navigate('/change-password');
        }, 800);
        return;
      }

      // Store auth data
      authUtils.clearPasswordChangeData();
      authUtils.setAuthData(access_token, user_id, role, userEmail, branch);

      setSuccess('Login successful! Redirecting...');

      // Redirect based on role
      setTimeout(() => {
        const normalizedRole = normalizeRole(role);
        if (normalizedRole === 'Student') {
          navigate('/student-dashboard');
        } else  {
          navigate('/tpo/dashboard');
        }
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // LAYOUT: Full-height container with two sections (left hidden on mobile)
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* LEFT SECTION - Branding / Landing Content (Hidden on mobile, 50% width on desktop) */}
      {/* COLOR SCHEME: Dashboard-consistent blue → indigo → purple gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden flex-col justify-center items-center p-12">
        {/* Decorative Background Circles */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 border border-white opacity-10 rounded-full"></div>
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition">
              {/* Icon color matches dashboard primary (blue) */}
              <Zap className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-6xl font-extrabold text-white mb-4 leading-tight">
            PlacementHub
          </h1>
          
          {/* Subtitle - Light text on gradient background */}
          <p className="text-xl text-blue-50 mb-8 font-semibold">
            Placement Trends &amp; Skill Analysis
          </p>
          
          {/* Description - Subtle text color */}
          <p className="text-base text-blue-100 leading-relaxed mb-12">
            Analyze placement trends, in-demand skills, and student readiness using data-driven insights. Empower your career with actionable intelligence.
          </p>
          
          {/* Feature Bullets - Light accent colors from gradient theme */}
          <div className="space-y-4 text-left">
            <div className="flex items-start">
              <TrendingUp className="w-5 h-5 text-blue-200 mr-3 mt-1 flex-shrink-0" />
              <span className="text-blue-100 text-sm">Track placement trends across batches</span>
            </div>
            <div className="flex items-start">
              <BarChart3 className="w-5 h-5 text-blue-200 mr-3 mt-1 flex-shrink-0" />
              <span className="text-blue-100 text-sm">Discover in-demand technical skills</span>
            </div>
            <div className="flex items-start">
              <Zap className="w-5 h-5 text-blue-200 mr-3 mt-1 flex-shrink-0" />
              <span className="text-blue-100 text-sm">Get personalized skill recommendations</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* RIGHT SECTION - Login Form (Full width on mobile, 50% width on desktop) */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col justify-center items-center p-4 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile Logo - Visible only on small screens */}
          {/* COLOR SCHEME: Dashboard-consistent blue → indigo gradient */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PlacementHub
            </h1>
          </div>
          
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600 mb-8 text-sm">
              Sign in to access your personalized dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Student ID / Email Input */}
              <div className="mb-6">
                <label htmlFor="email" className="text-gray-700 font-semibold mb-3 text-sm flex items-center">
                  {/* Icon color matches dashboard primary (blue) */}
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  Student ID or Email
                </label>
                <input
                  id="email"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="22IT101 or your.email@college.edu"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition font-medium"
                  required
                  autoComplete="username"
                />
              </div>

              {/* Password Input */}
              <div className="mb-6">
                <label htmlFor="password" className="text-gray-700 font-semibold mb-3 text-sm flex items-center">
                  {/* Icon color matches dashboard primary (blue) */}
                  <Lock className="w-4 h-4 mr-2 text-blue-600" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition font-medium"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-700 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-start p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-green-700 font-medium text-sm">{success}</p>
                </div>
              )}

              {/* Sign In Button - Dashboard-consistent gradient (blue → purple) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99] mt-8"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
