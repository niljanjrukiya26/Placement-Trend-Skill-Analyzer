import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Briefcase, Layers } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { analyticsService, studentService } from '../services/api';
import { normalizeBranchName, branchesMatch } from '../utils/branch';
import { getUniqueDomains } from '../utils/domain';

export default function DomainListPage() {
  const navigate = useNavigate();

  const [studentBranch, setStudentBranch] = useState('');
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setLoading(true);
        setError('');

        const studentRes = await studentService.getProfile();
        const normalizedBranch = normalizeBranchName(studentRes.data?.data?.branch);
        setStudentBranch(normalizedBranch);

        const rolesRes = await analyticsService.getDomainJobRoles();
        const allDomainRoles = rolesRes.data?.data || [];

        const filteredRoles = allDomainRoles.filter((role) => {
          const eligibleBranches = role.eligible_branches || [];
          return eligibleBranches.some((eligible) => branchesMatch(eligible, normalizedBranch));
        });

        setDomains(getUniqueDomains(filteredRoles));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load domains');
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Sidebar />
        <div className="lg:ml-72 transition-all duration-300">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading domains...</p>
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
            <h1 className="text-4xl font-bold text-gray-900 flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
                <Layers className="w-6 h-6 text-blue-600" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Domain Wise Skills
              </span>
            </h1>
            <p className="text-gray-600 mt-2 font-medium">
              Available domains for <span className="font-bold text-blue-600">{studentBranch}</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {domains.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {domains.map((item) => (
                <button
                  key={item.domain}
                  type="button"
                  onClick={() => navigate(`/domain-skills/${encodeURIComponent(item.domain)}`)}
                  className="text-left bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-100 p-6 hover:border-indigo-300 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.domain}</h3>
                  <div className="flex items-center text-indigo-700 font-semibold">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {item.roleCount} job role{item.roleCount > 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 bg-white rounded-xl shadow-md border border-gray-100">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-semibold">No domains available for your branch</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
