/**
 * Change Password Page Component - Modern Landing Page Style
 * Forces first-login password updates with DOB verification
 * Split layout: LEFT (branding) | RIGHT (change password form)
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { authUtils } from '../utils/auth';
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle, Eye, EyeOff, Lock, TrendingUp, BarChart3, Zap } from 'lucide-react';

const DEFAULT_PASSWORD_BY_ROLE = {
  Student: 'Student123',
  TPO: 'TPO123',
  MAIN_TPO: 'TPO123',
  BRANCH_TPO: 'TPO123',
};

export default function ChangePassword() {
  const navigate = useNavigate();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [changeToken, setChangeToken] = useState('');

  useEffect(() => {
    const token = authUtils.getPasswordChangeToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setChangeToken(token);
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!dateOfBirth || !newPassword || !confirmPassword) {
      setError('Please fill all required fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    const role = authUtils.getPasswordChangeRole();
    const defaultPassword = DEFAULT_PASSWORD_BY_ROLE[role] || '';
    if (defaultPassword && newPassword === defaultPassword) {
      setError('New password cannot be the default password. Please choose a different password.');
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword(changeToken, {
        date_of_birth: dateOfBirth,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      authUtils.clearPasswordChangeData();
      setSuccess('Password changed successfully. Please sign in with your new password.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden flex-col justify-center items-center p-12">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 border border-white opacity-10 rounded-full"></div>
        <div className="relative z-10 text-center max-w-md">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <Zap className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <h1 className="text-6xl font-extrabold text-white mb-4 leading-tight">PlacementHub</h1>
          <p className="text-xl text-blue-50 mb-8 font-semibold">Placement Trends &amp; Skill Analysis</p>
          <p className="text-base text-blue-100 leading-relaxed mb-12">
            Complete your first sign-in by verifying your date of birth and setting a new password.
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-start">
              <TrendingUp className="w-5 h-5 text-blue-200 mr-3 mt-1 flex-shrink-0" />
              <span className="text-blue-100 text-sm">Secure first-login password setup</span>
            </div>
            <div className="flex items-start">
              <BarChart3 className="w-5 h-5 text-blue-200 mr-3 mt-1 flex-shrink-0" />
              <span className="text-blue-100 text-sm">Verify your account with date of birth</span>
            </div>
            <div className="flex items-start">
              <Zap className="w-5 h-5 text-blue-200 mr-3 mt-1 flex-shrink-0" />
              <span className="text-blue-100 text-sm">Keep your account protected with bcrypt</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col justify-center items-center p-4 lg:p-12">
        <div className="w-full max-w-sm">
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

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            {!success ? (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h2>
                <p className="text-gray-600 mb-8 text-sm">
                  Verify your date of birth, then create your new password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="mb-6">
                    <label htmlFor="dob" className="text-gray-700 font-semibold mb-3 text-sm flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2 text-blue-600" />
                      Date of Birth
                    </label>
                    <input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition font-medium"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="newPassword" className="text-gray-700 font-semibold mb-3 text-sm flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-blue-600" />
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition font-medium"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-700 transition"
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="text-gray-700 font-semibold mb-3 text-sm flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-blue-600" />
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition font-medium"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-700 transition"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-red-700 font-medium text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99] mt-8"
                  >
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Password Updated</h3>
                <p className="text-gray-600 mb-2 text-sm">
                  Your password has been changed successfully.
                </p>
                <p className="text-gray-500 text-xs mb-6">Please sign in again with your new password.</p>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-6">
                  <p className="text-blue-800 text-sm font-medium">You can now sign in from the login page.</p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline transition"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
