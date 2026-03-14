import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { skillgapService } from '../services/api';
import { AlertCircle, Brain, Briefcase } from 'lucide-react';

const getSkillGapLabel = (percentage) => {
  const value = Number.isFinite(percentage) ? percentage : 0;
  if (value < 40) return 'High';
  if (value < 70) return 'Medium';
  return 'Low';
};

const renderReadinessBar = (percentage) => {
  const safe = Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : 0;

  return (
    <div className="mt-1">
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
};

const getDomainSummary = (domainBlock) => {
  const roles = Array.isArray(domainBlock.job_roles) ? domainBlock.job_roles : [];
  if (!roles.length) {
    return {
      averageReadiness: 0,
      totalRoles: 0,
      totalMatchedSkills: 0,
      totalMissingSkills: 0,
    };
  }

  let readinessSum = 0;
  let readinessCount = 0;
  let matched = 0;
  let missing = 0;

  roles.forEach((role) => {
    const r = Number.isFinite(role.readiness_percentage) ? role.readiness_percentage : 0;
    readinessSum += r;
    readinessCount += 1;

    const matchedSkills = Array.isArray(role.matched_skills) ? role.matched_skills : [];
    const missingSkills = Array.isArray(role.missing_skills) ? role.missing_skills : [];
    matched += matchedSkills.length;
    missing += missingSkills.length;
  });

  const averageReadiness = readinessCount ? Math.round(readinessSum / readinessCount) : 0;

  return {
    averageReadiness,
    totalRoles: roles.length,
    totalMatchedSkills: matched,
    totalMissingSkills: missing,
  };
};

export default function SkillGap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await skillgapService.getDomainSkillGap();
        const payload = response.data?.data || [];
        setData(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load skill gap data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderSkillChip = (skill, matchedSkills, missingSkills) => {
    const isMatched = matchedSkills?.includes(skill);
    const isMissing = missingSkills?.includes(skill);

    const baseClasses = 'inline-block px-2.5 py-1 rounded-full text-xs font-semibold mr-2 mb-2';

    let colorClasses = 'bg-gray-100 text-gray-700';
    if (isMatched) {
      colorClasses = 'bg-green-100 text-green-800 border border-green-200';
    } else if (isMissing) {
      colorClasses = 'bg-red-100 text-red-800 border border-red-200';
    }

    return (
      <span key={skill} className={`${baseClasses} ${colorClasses}`}>
        {skill}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Sidebar />
        <div className="lg:ml-72 transition-all duration-300">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading skill gap analysis...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />
      <div className="lg:ml-72 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center mr-3">
                  <Brain className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Skill Gap Analysis
                </span>
              </h1>
              <p className="text-gray-600 mt-2 font-medium">
                Domain-wise readiness based on your selected interests and skills
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {!hasData ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-10 text-center">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-semibold text-lg">No Skill Gap Data Available</p>
              <p className="text-gray-500 text-sm mt-1">
                Update your interested domains and technical skills in your profile to see analysis here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {data.map((domainBlock) => {
                const summary = getDomainSummary(domainBlock);

                return (
                  <div
                    key={domainBlock.domain}
                    className="bg-white/90 rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200"
                  >
                    {/* Domain Summary */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 mr-3">
                            <Brain className="w-5 h-5 text-blue-600" />
                          </span>
                          {domainBlock.domain}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                          Average readiness and skill gap across all roles in this domain.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Avg Readiness</p>
                          <p className="text-lg font-bold text-indigo-600">{summary.averageReadiness}%</p>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Job Roles</p>
                          <p className="text-lg font-bold text-gray-900">{summary.totalRoles}</p>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Matched Skills</p>
                          <p className="text-lg font-bold text-emerald-600">{summary.totalMatchedSkills}</p>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Missing Skills</p>
                          <p className="text-lg font-bold text-red-600">{summary.totalMissingSkills}</p>
                        </div>
                      </div>
                    </div>

                    {/* Job Role Cards */}
                    {Array.isArray(domainBlock.job_roles) && domainBlock.job_roles.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {domainBlock.job_roles.map((role, index) => {
                          const totalRequired = Array.isArray(role.required_skills) ? role.required_skills.length : 0;
                          const matchedSkills = Array.isArray(role.matched_skills) ? role.matched_skills : [];
                          const missingSkills = Array.isArray(role.missing_skills) ? role.missing_skills : [];
                          const matchedCount = matchedSkills.length;
                          const readiness = Number.isFinite(role.readiness_percentage)
                            ? Math.max(0, Math.min(100, role.readiness_percentage))
                            : 0;
                          const skillGapLabel = getSkillGapLabel(readiness);

                          return (
                            <div
                              key={`${domainBlock.domain}-${role.job_role || index}`}
                              className="border border-gray-100 rounded-2xl p-4 bg-white/80 shadow-sm transform transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg flex flex-col"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center">
                                  <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mr-3">
                                    <Briefcase className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                      {role.job_role || 'Job Role'}
                                    </h3>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                      {matchedCount} / {totalRequired || 0} Skills Matched
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-indigo-700">
                                  {readiness}% Ready
                                </span>
                              </div>

                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] text-gray-500">
                                  Skill Gap: {skillGapLabel}
                                </p>
                              </div>

                              {renderReadinessBar(readiness)}

                              {Array.isArray(role.required_skills) && role.required_skills.length > 0 && (
                                <div className="mt-1">
                                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2 tracking-wide">
                                    Required Skills
                                  </p>
                                  <div className="flex flex-wrap">
                                    {role.required_skills.map((skill) =>
                                      renderSkillChip(skill, matchedSkills, missingSkills)
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mt-2">No job roles available for this domain.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
