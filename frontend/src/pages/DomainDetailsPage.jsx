import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Briefcase } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { analyticsService, studentService } from '../services/api';
import { normalizeBranchName } from '../utils/branch';

export default function DomainDetailsPage() {
  const navigate = useNavigate();
  const { domainName } = useParams();

  const selectedDomain = useMemo(() => decodeURIComponent(domainName || ''), [domainName]);

  const [studentBranch, setStudentBranch] = useState('');
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDomainDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const studentRes = await studentService.getProfile();
        const normalizedBranch = normalizeBranchName(studentRes.data?.data?.branch);
        setStudentBranch(normalizedBranch);

        const rolesRes = await analyticsService.getDomainJobRoles({
          domain: selectedDomain,
          branch: normalizedBranch,
        });

        setJobRoles(rolesRes.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load domain job roles');
      } finally {
        setLoading(false);
      }
    };

    fetchDomainDetails();
  }, [selectedDomain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Sidebar />
        <div className="lg:ml-72 transition-all duration-300">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading domain skills...</p>
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
          <div className="mb-8">
            <button
              type="button"
              onClick={() => navigate('/skill-demand')}
              className="inline-flex items-center text-sm font-semibold text-indigo-700 hover:text-indigo-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Domains
            </button>

            <h1 className="text-4xl font-bold text-gray-900 flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center mr-3">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {selectedDomain}
              </span>
            </h1>
            <p className="text-gray-600 mt-2 font-medium">
              Job roles available for <span className="font-bold text-blue-600">{studentBranch}</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {jobRoles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {jobRoles.map((role) => (
                <button
                  key={role.job_role_id || `${role.domain}-${role.job_role}`}
                  type="button"
                  onClick={() => navigate(`/placement-insights/${encodeURIComponent(role.job_role)}`)}
                  className="text-left bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-100 p-6 hover:border-indigo-300 hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{role.job_role}</h3>

                  {Array.isArray(role.required_skills) && role.required_skills.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-3 tracking-wide">Required Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {role.required_skills.map((skill) => (
                          <span
                            key={`${role.job_role}-${skill}`}
                            className="inline-block px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No specific skills listed</p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 bg-white rounded-xl shadow-md border border-gray-100">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-semibold">No job roles available for your branch in this domain</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
