import { useState, useEffect } from 'react';
import { studentService, analyticsService } from '../services/api';
import Sidebar from '../components/Sidebar';
import { AlertCircle, CheckCircle, User, BookOpen, Code, Save, X } from 'lucide-react';
import { normalizeBranchName, branchesMatch } from '../utils/branch';

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [interestedOptions, setInterestedOptions] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);
  const [selectedInterestedFields, setSelectedInterestedFields] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [interestedSelectValue, setInterestedSelectValue] = useState('');
  const [skillInputValue, setSkillInputValue] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch dropdown options after student profile is loaded
  useEffect(() => {
    if (student?.branch) {
      fetchDropdownOptions();
    }
  }, [student?.branch]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await studentService.getProfile();
      const data = response.data.data;
      setStudent(data);
      const interestedArray = Array.isArray(data.interested_field)
        ? data.interested_field
        : data.interested_field
          ? [data.interested_field]
          : [];
      setSelectedInterestedFields(interestedArray);
      setSelectedSkills(data.skills || []);
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * FETCH BRANCH-FILTERED DROPDOWN OPTIONS
   * Fetches all job roles and filters based on student's branch
   * Extracts unique interested fields (job_role names) and technical skills (required_skills)
   */
  const fetchDropdownOptions = async () => {
    try {
      if (!student?.branch) {
        console.warn('Student branch not available yet');
        return;
      }

      // Fetch all job roles from backend
      const response = await analyticsService.getJobRoles();
      const allJobRoles = response.data.data || [];

      // Get normalized branch names for the student's branch
      const normalizedStudentBranch = normalizeBranchName(student.branch);

      // Filter job roles by canonical branch match.
      const branchMatchedJobRoles = allJobRoles.filter((jobRole) => {
        const eligibleBranches = jobRole.eligible_branches || [];
        return eligibleBranches.some((eligibleBranch) => branchesMatch(eligibleBranch, normalizedStudentBranch));
      });

      // Extract unique interested fields (job_role names)
      const uniqueInterestedFields = [
        ...new Set(branchMatchedJobRoles.map((role) => role.job_role)),
      ].sort();

      // Extract unique technical skills (required_skills)
      const allSkills = branchMatchedJobRoles.flatMap(
        (role) => role.required_skills || []
      );
      const uniqueSkills = [...new Set(allSkills)].sort();

      setInterestedOptions(uniqueInterestedFields);
      setSkillOptions(uniqueSkills);
    } catch (err) {
      console.error('Failed to load dropdown options:', err);
      setInterestedOptions([]);
      setSkillOptions([]);
    }
  };

  /**
   * DUPLICATE PREVENTION LOGIC
   * Filters out already selected items from dropdown options
   * This ensures:
   * 1. Selected items appear only as chips, not in dropdown
   * 2. When a chip is removed (×), it reappears in the dropdown
   * 3. No duplicate selection is possible
   */
  const availableInterestedOptions = interestedOptions.filter(
    (option) => !selectedInterestedFields.includes(option)
  );

  const availableSkillOptions = skillOptions.filter(
    (option) => !selectedSkills.includes(option)
  );

  /**
   * ADD INTERESTED FIELD HANDLER
   * Adds selected field to the chips display
   * Prevents duplicates (already filtered by availableInterestedOptions)
   */
  const handleAddInterestedField = () => {
    if (!interestedSelectValue) return;
    if (selectedInterestedFields.includes(interestedSelectValue)) return;
    setSelectedInterestedFields((prev) => [...prev, interestedSelectValue]);
    setInterestedSelectValue('');
  };

  /**
   * REMOVE INTERESTED FIELD HANDLER
   * Removes field from chips - it will automatically reappear in dropdown
   * due to the availableInterestedOptions filter logic
   */
  const handleRemoveInterestedField = (field) => {
    setSelectedInterestedFields((prev) => prev.filter((item) => item !== field));
  };

  /**
   * ADD TECHNICAL SKILL HANDLER
   * Validates input against available branch-specific skills
   * Prevents duplicates and only allows skills from availableSkillOptions
   */
  const handleAddSkill = (e) => {
    e.preventDefault();
    const normalizedInput = skillInputValue.trim();
    if (!normalizedInput) return;

    // Match input with available options (case-insensitive)
    const matched = availableSkillOptions.find(
      (option) => option.toLowerCase() === normalizedInput.toLowerCase()
    );

    if (!matched || selectedSkills.includes(matched)) {
      setSkillInputValue('');
      return;
    }

    setSelectedSkills((prev) => [...prev, matched]);
    setSkillInputValue('');
  };

  /**
   * REMOVE TECHNICAL SKILL HANDLER
   * Removes skill from chips - it will automatically reappear in dropdown
   * due to the availableSkillOptions filter logic
   */
  const handleRemoveSkill = (skill) => {
    setSelectedSkills((prev) => prev.filter((item) => item !== skill));
  };

  const handleSave = async () => {
    try {
      setError('');
      await studentService.updateProfile({
        interested_field: selectedInterestedFields,
        skills: selectedSkills,
      });
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      setTimeout(() => setSuccess(''), 3000);
      fetchProfile();
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Sidebar />
        <div className="lg:ml-72 transition-all duration-300">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading profile...</p>
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Student Profile
          </h1>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        )}

        {student && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                Academic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-600 text-sm font-bold uppercase tracking-wide block mb-2">Student ID</label>
                  <input type="text" value={student.student_id} disabled className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg cursor-not-allowed border-2 border-gray-200 font-medium" />
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-bold uppercase tracking-wide block mb-2">Branch</label>
                  <input type="text" value={student.branch} disabled className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg cursor-not-allowed border-2 border-gray-200 font-medium" />
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-bold uppercase tracking-wide block mb-2">CGPA</label>
                  <input type="text" value={student.cgpa?.toFixed(2)} disabled className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg cursor-not-allowed border-2 border-gray-200 font-medium" />
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-bold uppercase tracking-wide block mb-2">Backlogs</label>
                  <input type="text" value={student.backlogs} disabled className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg cursor-not-allowed border-2 border-gray-200 font-medium" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center mr-3">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                Career Information
              </h2>

              <div className="mb-8">
                <label className="text-gray-600 text-sm font-bold uppercase tracking-wide block mb-2">Interested Field</label>
                {editMode ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select
                        value={interestedSelectValue}
                        onChange={(e) => setInterestedSelectValue(e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition font-medium"
                      >
                        <option value="">Select interested field</option>
                        {availableInterestedOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddInterestedField}
                        disabled={!interestedSelectValue}
                        className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>

                    {/* Empty state when no branch-specific options are available */}
                    {availableInterestedOptions.length === 0 && selectedInterestedFields.length === 0 && (
                      <p className="text-gray-500 text-sm italic">No options available for your branch.</p>
                    )}
                    {availableInterestedOptions.length === 0 && selectedInterestedFields.length > 0 && (
                      <p className="text-gray-500 text-sm italic">All available options for your branch have been selected.</p>
                    )}

                    {selectedInterestedFields.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {selectedInterestedFields.map((field) => (
                          <div
                            key={field}
                            className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 rounded-full text-sm font-bold flex items-center border border-purple-200"
                          >
                            {field}
                            <button
                              type="button"
                              onClick={() => handleRemoveInterestedField(field)}
                              className="ml-2 text-purple-600 hover:text-purple-800 font-bold hover:bg-purple-200 rounded-full w-5 h-5 flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {(Array.isArray(student.interested_field)
                      ? student.interested_field
                      : student.interested_field
                        ? [student.interested_field]
                        : []
                    ).map((field) => (
                      <span
                        key={field}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold border border-gray-200"
                      >
                        {field}
                      </span>
                    ))}
                    {(!student.interested_field || (Array.isArray(student.interested_field) && student.interested_field.length === 0)) && (
                      <span className="text-gray-500 text-sm italic">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-gray-600 text-sm font-bold uppercase tracking-wide block mb-3">
                  <Code className="inline-block w-4 h-4 mr-2" />
                  Technical Skills
                </label>

                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {selectedSkills.map((skill) => (
                      <div key={skill} className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 rounded-full text-sm font-bold flex items-center border border-indigo-200">
                        {skill}
                        {editMode && (
                          <button onClick={() => handleRemoveSkill(skill)} className="ml-2 text-indigo-600 hover:text-indigo-800 font-bold hover:bg-indigo-200 rounded-full w-5 h-5 flex items-center justify-center">
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {editMode && (
                  <>
                    <form onSubmit={handleAddSkill} className="flex gap-2 mb-4">
                      <input
                        list="skill-options"
                        value={skillInputValue}
                        onChange={(e) => setSkillInputValue(e.target.value)}
                        placeholder="Search and select a skill"
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition font-medium"
                      />
                      {/* Datalist keeps the dropdown keyboard accessible */}
                      <datalist id="skill-options">
                        {availableSkillOptions.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                      <button
                        type="submit"
                        disabled={!skillInputValue.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </form>

                    {/* Empty state when no branch-specific skills are available */}
                    {availableSkillOptions.length === 0 && selectedSkills.length === 0 && (
                      <p className="text-gray-500 text-sm italic">No skill options available for your branch.</p>
                    )}
                    {availableSkillOptions.length === 0 && selectedSkills.length > 0 && (
                      <p className="text-gray-500 text-sm italic">All available skills for your branch have been selected.</p>
                    )}
                  </>
                )}

                {selectedSkills.length === 0 && !editMode && (
                  <p className="text-gray-500 text-sm italic">No skills added yet. Click Edit Profile to add skills.</p>
                )}
              </div>
            </div>

            {editMode && (
              <div className="flex gap-3">
                <button onClick={handleSave} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg transition flex items-center justify-center">
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    const interestedArray = Array.isArray(student?.interested_field)
                      ? student.interested_field
                      : student?.interested_field
                        ? [student.interested_field]
                        : [];
                    setSelectedInterestedFields(interestedArray);
                    setSelectedSkills(student?.skills || []);
                    setInterestedSelectValue('');
                    setSkillInputValue('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg transition flex items-center justify-center"
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
