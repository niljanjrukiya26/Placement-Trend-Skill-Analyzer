/**
 * Branch-wise Job Role & Skill Analysis
 * Displays job roles and required skills specific to student's branch
 * Features: Branch normalization, job role filtering
 */
import React, { useState, useEffect } from 'react';
import { analyticsService, studentService } from '../services/api';
import Sidebar from '../components/Sidebar';
import { AlertCircle, Briefcase, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * Branch Normalization Mapping
 * Maps short branch codes to possible full branch names in database
 */
const BRANCH_MAPPING = {
  'IT': ['IT', 'Information Technology', 'IT Engineering'],
  'CP': ['CP', 'Computer Engineering', 'Computer'],
  'CSE': ['CSE', 'Computer Science', 'Computer Science Engineering'],
  'Mechanical': ['Mechanical', 'Mechanical Engineering'],
  'Electrical': ['Electrical', 'Electrical Engineering', 'EE'],
  'Civil': ['Civil', 'Civil Engineering'],
  'EC': ['EC', 'Electronics', 'Electronics & Communication', 'E&C'],
  'Instrumentation': ['Instrumentation', 'Instrumentation Engineering'],
};

export default function SkillDemand() {
  const [studentBranch, setStudentBranch] = useState('');
  const [filteredJobRoles, setFilteredJobRoles] = useState([]);
  const [skillDemandData, setSkillDemandData] = useState([]);
  const [skillToRoles, setSkillToRoles] = useState({}); // Mapping of skill to job roles
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch student profile to get branch
      console.log('[SkillDemand] Fetching student profile...');
      const studentRes = await studentService.getProfile();
      const branch = studentRes.data.data.branch;
      console.log('[SkillDemand] Student branch from profile:', branch);
      setStudentBranch(branch);

      // 2. Fetch all job roles
      console.log('[SkillDemand] Fetching all job roles...');
      const rolesRes = await analyticsService.getJobRoles();
      const allJobRoles = rolesRes.data.data;
      console.log('[SkillDemand] Total job roles fetched:', allJobRoles.length);

      // 3. Get normalized branch names for matching
      const normalizedBranches = getNormalizedBranchNames(branch);
      console.log('[SkillDemand] Normalized branch names for matching:', normalizedBranches);

      // 4. Filter job roles by branch
      const filtered = filterJobRolesByBranch(allJobRoles, normalizedBranches);
      console.log('[SkillDemand] Filtered job roles count:', filtered.length);
      console.log('[SkillDemand] Filtered job roles:', filtered.map(r => r.job_role));

      setFilteredJobRoles(filtered);

      // 5. Calculate skill demand ranking
      const skillDemand = calculateSkillDemand(filtered);
      setSkillDemandData(skillDemand.ranked);
      setSkillToRoles(skillDemand.mapping);
      console.log('[SkillDemand] Skill demand ranking:', skillDemand.ranked);

    } catch (err) {
      console.error('[SkillDemand] Error during data fetch:', err);
      setError(err.response?.data?.message || 'Failed to load job roles and skills');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Extract top N skills from a list of skills
   * @param {Array} skillsArray - Array of skill objects with skill, count, percentage
   * @param {number} limit - Maximum number of skills to return (default: 10)
   * @returns {Array} - Top N skills sorted by count (descending)
   */
  const getTopSkills = (skillsArray, limit = 10) => {
    return skillsArray.slice(0, Math.min(limit, skillsArray.length));
  };

  /**
   * Calculate skill demand ranking
   * @param {Array} jobRoles - Filtered job roles
   * @returns {Object} - { ranked: Array of skills with counts, mapping: skill -> job roles }
   */
  const calculateSkillDemand = (jobRoles) => {
    const skillCount = {};
    const skillToJobRoles = {};

    // Count skills across all job roles
    jobRoles.forEach((role) => {
      const skills = role.required_skills || [];
      skills.forEach((skill) => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
        if (!skillToJobRoles[skill]) {
          skillToJobRoles[skill] = [];
        }
        skillToJobRoles[skill].push(role.job_role);
      });
    });

    // Convert to sorted array
    const rankedSkills = Object.entries(skillCount)
      .map(([skill, count]) => ({
        skill,
        count,
        percentage: (count / jobRoles.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      ranked: rankedSkills,
      mapping: skillToJobRoles,
    };
  };

  /**
   * Get all possible branch name variations for matching
   * @param {string} studentBranch - Branch code from student profile
   * @returns {Array<string>} - All variations of branch name to match against
   */
  const getNormalizedBranchNames = (studentBranch) => {
    // Check if branch is in our mapping
    for (const [code, names] of Object.entries(BRANCH_MAPPING)) {
      if (code === studentBranch) {
        console.log(`[getNormalizedBranchNames] Found mapping for "${studentBranch}":`, names);
        return names;
      }
    }
    
    // If not in mapping, return the branch as-is (fallback)
    console.log(`[getNormalizedBranchNames] No mapping found for "${studentBranch}", using as-is`);
    return [studentBranch];
  };

  /**
   * Filter job roles to only those matching student's branch
   * @param {Array} jobRoles - All job roles from database
   * @param {Array<string>} normalizedBranches - Branch name variations to match
   * @returns {Array} - Job roles applicable to student's branch
   */
  const filterJobRolesByBranch = (jobRoles, normalizedBranches) => {
    return jobRoles.filter((role) => {
      const eligibleBranches = role.eligible_branches || [];
      
      // Check if ANY eligible branch matches ANY normalized branch name
      const matches = eligibleBranches.some((eligible) =>
        normalizedBranches.some((normalized) =>
          eligible.toLowerCase().trim() === normalized.toLowerCase().trim()
        )
      );
      
      if (matches) {
        console.log(`[filterJobRolesByBranch] ✓ Matched: "${role.job_role}" eligible for ${eligibleBranches.join(', ')}`);
      }
      
      return matches;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Sidebar />
        <div className="lg:ml-72 transition-all duration-300">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading branch-wise job roles...</p>
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Domain Wise Skills
              </span>
            </h1>
            <p className="text-gray-600 mt-2 font-medium">
              Job roles and required skills for <span className="font-bold text-blue-600">{studentBranch}</span> branch
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start animate-pulse">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Job Roles for Branch */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center mr-3">
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </div>
              Job Roles for {studentBranch}
              {filteredJobRoles.length > 0 && (
                <span className="ml-auto text-lg font-semibold text-indigo-600 bg-indigo-100 px-4 py-2 rounded-full">
                  {filteredJobRoles.length} roles
                </span>
              )}
            </h2>

            {filteredJobRoles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobRoles.map((role, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-100 p-6 hover:border-indigo-300 hover:shadow-lg transition"
                  >
                    {/* Job Role Name */}
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      {role.job_role}
                    </h3>

                    {/* Required Skills */}
                    {role.required_skills && role.required_skills.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-3 tracking-wide">
                          Required Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {role.required_skills.map((skill, i) => (
                            <span
                              key={i}
                              className="inline-block px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs font-semibold hover:shadow-md transition cursor-pointer"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        No specific skills listed
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold">
                  No job roles found for {studentBranch} branch
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Please check back soon for more opportunities
                </p>
              </div>
            )}
          </div>

          {/* Top In-Demand Skills Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              Top In-Demand Skills
            </h2>

            {skillDemandData.length > 0 ? (
              <>

                {/* Bar Chart Visualization */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Skill Demand Chart</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {skillDemandData.length > 10 
                        ? `Showing top 10 of ${skillDemandData.length} skills` 
                        : `Showing all ${skillDemandData.length} skills`}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={getTopSkills(skillDemandData)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="skill"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis
                          label={{ value: 'Number of Job Roles', angle: -90, position: 'insideLeft' }}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px',
                          }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload[0]) {
                              const data = payload[0].payload;
                              const jobRoles = skillToRoles[data.skill] || [];
                              return (
                                <div className="bg-white border-2 border-gray-300 rounded-lg p-3 shadow-lg text-sm">
                                  <p className="font-bold text-gray-900">{data.skill}</p>
                                  <p className="text-gray-700 mt-1">
                                    <span className="font-semibold">{data.count}</span> job roles
                                  </p>
                                  {jobRoles.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <p className="text-xs font-semibold text-gray-600 mb-1">Required by:</p>
                                      <ul className="text-xs text-gray-700 space-y-0.5">
                                        {jobRoles.slice(0, 5).map((role, i) => (
                                          <li key={i} className="flex items-start">
                                            <span className="text-blue-500 mr-1">•</span>
                                            <span>{role}</span>
                                          </li>
                                        ))}
                                        {jobRoles.length > 5 && (
                                          <li className="text-blue-600 font-semibold">
                                            +{jobRoles.length - 5} more
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#6366f1"
                          radius={[8, 8, 0, 0]}
                          name="Number of Job Roles"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold">No skill demand data available</p>
                <p className="text-gray-500 text-sm mt-2">
                  There are no job roles to analyze for your branch
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

