/**
 * Forgot Password Page Component - Modern Landing Page Style
 * Allows users to request a password reset link via email
 * Split layout: LEFT (branding) | RIGHT (forgot password form)
 * UI-only implementation for college project (backend integration optional)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Zap, TrendingUp, BarChart3 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /**
   * Handle forgot password form submission
   * Shows success message regardless of email existence (security best practice)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      // Auto redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    }, 1500);

    // TODO: Add backend API call here when ready
    // try {
    //   await authService.forgotPassword(email);
    //   setSuccess(true);
    // } catch (err) {
    //   setError('Failed to send reset link. Please try again.');
    // }
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
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
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
      
      {/* RIGHT SECTION - Forgot Password Form (Full width on mobile, 50% width on desktop) */}
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
          
          {/* Forgot Password Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            {!success ? (
              <>
                {/* Card Header */}
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Forgot Password?
                </h2>
                <p className="text-gray-600 text-sm mb-8">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {/* Forgot Password Form */}
                <form onSubmit={handleSubmit} className="space-y-2">
                  {/* Email Input */}
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-gray-700 font-semibold mb-3 text-sm flex items-center">
                      {/* Icon color matches dashboard primary (blue) */}
                      <Mail className="w-4 h-4 mr-2 text-blue-600" />
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@college.edu"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition font-medium"
                      required
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-red-700 font-medium text-sm">{error}</p>
                    </div>
                  )}

                  {/* Submit Button - Dashboard-consistent gradient (blue → purple) */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99] mt-8"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Sending...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>

                {/* Back to Login Link - Dashboard color scheme (blue) */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 font-semibold transition group"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
                    Back to Login
                  </button>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Check Your Email
                </h3>
                <p className="text-gray-600 mb-2 text-sm">
                  If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
                </p>
                <p className="text-gray-500 text-xs mb-6">
                  Please check your inbox and spam folder.
                </p>
                
                {/* Auto-redirect message */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-6">
                  <p className="text-blue-800 text-sm font-medium">
                    Redirecting to login page in 5 seconds...
                  </p>
                </div>

                {/* Manual redirect button - Dashboard color scheme (blue) */}
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline transition"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Login Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
