/**
 * TPO (Training & Placement Officer) Dashboard
 * Main dashboard for TPO showing branch statistics and overview
 */
import React, { useState, useEffect } from 'react';
import { tpoService } from '../services/api';
import { authUtils } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import {
  Users,
  TrendingUp,
  Building2,
  BarChart3,
  AlertCircle,
  Award,
} from 'lucide-react';

export default function TPODashboard() {
  const [tpoInfo, setTpoInfo] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTPOData();
  }, []);

  const fetchTPOData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current user info
      const currentUser = authUtils.getUser();
      setUser(currentUser);

      // Fetch TPO profile
      const profileResponse = await tpoService.getProfile();
      setTpoInfo(profileResponse.data.data);

      // Fetch branch statistics only if not TPO
      if (currentUser?.role !== 'TPO') {
        const statsResponse = await tpoService.getBranchStatistics();
        setStatistics(statsResponse.data.data);
      }
    } catch (err) {
      setError('Failed to load TPO dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Sidebar />
        <div className="lg:ml-72 transition-all duration-300">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading TPO dashboard...</p>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />
      <div className="lg:ml-72 transition-all duration-300">

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        {tpoInfo && (
          <div className="mb-8 p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold">
                  Welcome, {tpoInfo.tpo_name}!
                </h1>
                <p className="mt-2 text-blue-100 font-semibold text-lg">
                  Training &amp; Placement Officer - {tpoInfo.branch} Department
                </p>
                <p className="text-sm text-blue-200 mt-2">ID: {tpoInfo.tpo_id}</p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur">
                <Award className="w-8 h-8" />
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Dashboard Content - Hidden for TPO users */}
        {user?.role !== 'TPO' && (
          <>
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Total Students Card */}
            <div className="group bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Total</span>
              </div>
              <p className="text-gray-600 text-sm font-semibold">Total Students</p>
              <h3 className="text-4xl font-bold text-blue-600 mt-2">
                {statistics.total_students}
              </h3>
              <p className="text-gray-500 text-xs mt-2">In {statistics.branch}</p>
            </div>

            {/* Placed Students Card */}
            <div className="group bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">Placed</span>
              </div>
              <p className="text-gray-600 text-sm font-semibold">Placed Students</p>
              <h3 className="text-4xl font-bold text-green-600 mt-2">
                {statistics.placed_students}
              </h3>
              <p className="text-gray-500 text-xs mt-2">This academic year</p>
            </div>

            {/* Placement % Card */}
            <div className="group bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">Rate</span>
              </div>
              <p className="text-gray-600 text-sm font-semibold">Success Rate</p>
              <h3 className="text-4xl font-bold text-purple-600 mt-2">
                {statistics.placement_percentage}%
              </h3>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600" style={{ width: `${statistics.placement_percentage}%` }}></div>
              </div>
            </div>

            {/* Average Package Card */}
            <div className="group bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">Salary</span>
              </div>
              <p className="text-gray-600 text-sm font-semibold">Avg Package</p>
              <h3 className="text-4xl font-bold text-orange-600 mt-2">
                {statistics.average_package} <span className="text-lg">LPA</span>
              </h3>
              <p className="text-gray-500 text-xs mt-2">Average salary</p>
            </div>
          </div>
        )}

        {/* Top Recruiting Companies */}
        {statistics && statistics.top_companies && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mr-3">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              Top Recruiting Companies
            </h2>

            {statistics.top_companies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statistics.top_companies.map((company, idx) => (
                  <div
                    key={idx}
                    className="group p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-lg hover:-translate-y-1 transition"
                  >
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-green-600 transition">
                      {company.company}
                    </h3>
                    <p className="text-4xl font-bold text-green-600 mt-3">
                      {company.count}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 font-semibold">
                      Students Placed
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-8 text-center italic">No company data available</p>
            )}
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border-2 border-blue-200 p-8">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
              <div className="w-6 h-6 bg-blue-600 rounded-full mr-2"></div>
              Your Responsibilities
            </h3>
            <ul className="space-y-3">
              <li className="text-sm text-gray-800 font-semibold flex items-center">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">✓</span>
                Manage student placements
              </li>
              <li className="text-sm text-gray-800 font-semibold flex items-center">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">✓</span>
                Track placement statistics
              </li>
              <li className="text-sm text-gray-800 font-semibold flex items-center">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">✓</span>
                Monitor company interactions
              </li>
              <li className="text-sm text-gray-800 font-semibold flex items-center">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">✓</span>
                View skill demand analytics
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border-2 border-green-200 p-8">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
              <div className="w-6 h-6 bg-green-600 rounded-full mr-2"></div>
              Department Overview
            </h3>
            {statistics && (
              <ul className="space-y-3">
                <li className="text-sm text-gray-800 font-semibold flex items-center">
                  <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">✓</span>
                  Placement Records: {statistics.placement_records}
                </li>
                <li className="text-sm text-gray-800 font-semibold flex items-center">
                  <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">✓</span>
                  Department: {statistics.branch}
                </li>
                <li className="text-sm text-gray-800 font-semibold flex items-center">
                  <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">✓</span>
                  Academic Year: {new Date().getFullYear()}
                </li>
                <li className="text-sm text-gray-800 font-semibold flex items-center">
                  <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">✓</span>
                  Last Updated: Today
                </li>
              </ul>
            )}
          </div>
        </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
