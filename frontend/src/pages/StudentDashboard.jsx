import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/api';
import { authUtils } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import {
  BookOpen,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Code,
  Award,
  TrendingUp,
  Zap,
} from 'lucide-react';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const response = await studentService.getProfile();
      setStudent(response.data.data);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Sidebar />
        <div className="lg:ml-72 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Sidebar />
        <div className="lg:ml-72 flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-red-600 font-semibold text-lg">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const getPlacementStatus = () => {
    if (student?.backlogs > 0) return { status: 'Not Eligible', color: 'red', bg: 'bg-red-50', border: 'border-red-200' };
    if (student?.cgpa < 6.0) return { status: 'At Risk', color: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { status: 'Eligible', color: 'green', bg: 'bg-green-50', border: 'border-green-200' };
  };

  const placementStatus = getPlacementStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />
      <div className="lg:ml-72 transition-all duration-300">

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header - Placement Status Removed */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{student?.student_id || 'Student'}</span>!
            </h1>
            <p className="text-gray-600 mt-2 font-medium">
              Here's your academic profile and placement readiness
            </p>
          </div>
        </div>

        {/* Stats Cards Grid - Only CGPA, Branch, Backlogs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* CGPA Card */}
          <div className="group bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Rating</span>
            </div>
            <p className="text-gray-600 text-sm font-semibold">CGPA</p>
            <h3 className="text-4xl font-bold text-blue-600 mt-2">
              {student?.cgpa?.toFixed(2)}
            </h3>
            <p className="text-gray-500 text-xs mt-2">Out of 10.0</p>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: `${(student?.cgpa / 10) * 100}%` }}></div>
            </div>
          </div>

          {/* Branch Card */}
          <div className="group bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">Stream</span>
            </div>
            <p className="text-gray-600 text-sm font-semibold">Branch</p>
            <h3 className="text-3xl font-bold text-green-600 mt-2">
              {student?.branch}
            </h3>
            
          </div>

          {/* Backlogs Card */}
          <div className="group bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${student?.backlogs === 0 ? 'bg-gradient-to-br from-green-100 to-green-200' : 'bg-gradient-to-br from-orange-100 to-orange-200'} rounded-lg flex items-center justify-center group-hover:scale-110 transition`}>
                {student?.backlogs === 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                )}
              </div>
              <span className={`text-xs font-bold ${student?.backlogs === 0 ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100'} px-3 py-1 rounded-full`}>
                Status
              </span>
            </div>
            <p className="text-gray-600 text-sm font-semibold">Backlogs</p>
            <h3 className={`text-3xl font-bold mt-2 ${student?.backlogs === 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {student?.backlogs}
            </h3>
            <p className="text-gray-500 text-xs mt-2">
              {student?.backlogs === 0 ? 'Clean record' : 'Active backlogs'}
            </p>
          </div>
          {/* Interest Card Removed - Now displayed below as chips */}
        </div>

        {/* Technical Skills Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center mr-3">
              <Code className="w-5 h-5 text-indigo-600" />
            </div>
            Technical Skills
          </h2>

          {student?.skills && student.skills.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {student.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 rounded-full text-sm font-bold hover:shadow-lg hover:scale-105 transition border border-indigo-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Code className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-4">No skills added yet.</p>
              <button
                onClick={() => navigate('/student-profile')}
                className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg transition"
              >
                Add Skills →
              </button>
            </div>
          )}
        </div>

        {/* Interested Fields Section - Displays career interests as chips */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mr-3">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            Interested Fields
          </h2>

          {student?.interested_field ? (
            <div className="flex flex-wrap gap-3">
              {(() => {
                // Handle both array and string formats
                const interests = Array.isArray(student.interested_field)
                  ? student.interested_field
                  : typeof student.interested_field === 'string'
                  ? student.interested_field.split(',')
                  : [student.interested_field];
                
                return interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-5 py-2 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 rounded-full text-sm font-bold hover:shadow-lg hover:scale-105 transition border border-purple-200"
                  >
                    {typeof interest === 'string' ? interest.trim() : interest}
                  </span>
                ));
              })()}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-4">No career interests added yet.</p>
              <button
                onClick={() => navigate('/student-profile')}
                className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg transition"
              >
                Add Interests →
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/student-profile')}
            className="group bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <BookOpen className="w-5 h-5 mr-2 group-hover:scale-110 transition" />
            View Full Profile
          </button>
          <button
            onClick={() => navigate('/placement-trend')}
            className="group bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <TrendingUp className="w-5 h-5 mr-2 group-hover:scale-110 transition" />
            Placement Trends
          </button>
          <button
            onClick={() => navigate('/skill-demand')}
            className="group bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition" />
            Skill Demand
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
