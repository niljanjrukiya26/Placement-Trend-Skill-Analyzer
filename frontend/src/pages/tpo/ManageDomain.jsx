import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Edit2,
  FileUp,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldAlert,
  Trash2,
  Trophy,
  UserCog,
  X,
} from 'lucide-react';
import { authUtils } from '../../utils/auth';
import { getCurrentUser, normalizeRole, ROLES } from '../../utils/tpo/roles';
import { domainService } from '../../services/api';
import Table from '../../components/tpo/Table';
import Sidebar from '../../components/Sidebar';

const DEFAULT_BRANCH_OPTIONS = [
  'Computer Engineering',
  'Information Technology',
  'Electrical Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
];

function getInitials(nameOrEmail) {
  if (!nameOrEmail || typeof nameOrEmail !== 'string') return 'TP';
  const tokens = nameOrEmail.trim().split(/\s+/);
  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

function normalizeDomainRolesResponse(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.domain_job_roles)) return payload.domain_job_roles;
  if (Array.isArray(payload)) return payload;
  return [];
}

function toDomainRoleId(item) {
  return item?.id || item?._id || item?.job_role_id;
}

function normalizeJobRoleName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export default function ManageDomain() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isMain = normalizeRole(user.role) === ROLES.MAIN_TPO;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [jobRoleId, setJobRoleId] = useState('');
  const [domains, setDomains] = useState([]);
  const [skills, setSkills] = useState([]);
  const [branches, setBranches] = useState(DEFAULT_BRANCH_OPTIONS);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editSelectedSkill, setEditSelectedSkill] = useState('');
  const [editSelectedBranch, setEditSelectedBranch] = useState('');
  const [tableFilters, setTableFilters] = useState({
    domain: '',
    branch: '',
  });
  const [form, setForm] = useState({
    job_role: '',
    domain: '',
  });

  const displayName = useMemo(() => user.email?.split('@')[0] || 'TPO User', [user.email]);
  const roleLabel = isMain ? 'Main TPO' : 'Branch TPO';

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(showToast.timerId);
    showToast.timerId = window.setTimeout(() => setToast(null), 2800);
  };

  const loadPageData = async () => {
    try {
      setLoading(true);

      const [rowsRes, nextIdRes, domainsRes, skillsRes, branchesRes] = await Promise.all([
        domainService.getDomainJobRoles(),
        domainService.getNextJobRoleId(),
        domainService.getDomainOptions(),
        domainService.getSkillOptions(),
        domainService.getBranchOptions(),
      ]);

      const roleRows = normalizeDomainRolesResponse(rowsRes?.data);
      setRows(roleRows);
      setJobRoleId(String(nextIdRes?.data?.data?.job_role_id || ''));

      const domainOptions = domainsRes?.data?.data;
      setDomains(Array.isArray(domainOptions) ? domainOptions : []);

      const skillOptions = skillsRes?.data?.data;
      const branchOptions = branchesRes?.data?.data;

      setSkills(Array.isArray(skillOptions) ? skillOptions : []);
      setBranches(
        Array.isArray(branchOptions) && branchOptions.length > 0
          ? branchOptions
          : DEFAULT_BRANCH_OPTIONS
      );

      if (!Array.isArray(skillOptions) || !skillOptions.length) {
        const fallbackSkills = new Set();
        roleRows.forEach((row) => {
          (row.required_skills || []).forEach((item) => {
            if (typeof item === 'string' && item.trim()) fallbackSkills.add(item.trim());
          });
        });
        if (fallbackSkills.size > 0) setSkills(Array.from(fallbackSkills).sort());
      }
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to load domain data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isMain) return;
    loadPageData();
  }, [isMain]);

  const handleLogout = () => {
    authUtils.clearAuthData();
    navigate('/login');
  };

  const validateForm = () => {
    if (!jobRoleId) {
      showToast('error', 'Unable to generate Job Role ID. Please refresh the page.');
      return false;
    }

    if (!form.job_role.trim() || !form.domain.trim()) {
      showToast('error', 'Job role and domain are required.');
      return false;
    }

    if (!selectedSkills.length) {
      showToast('error', 'Please add at least one required skill.');
      return false;
    }

    if (!selectedBranches.length) {
      showToast('error', 'Please add at least one eligible branch.');
      return false;
    }

    return true;
  };

  const handleAddSkill = () => {
    const value = String(selectedSkill || '').trim();
    if (!value) return;

    if (selectedSkills.some((item) => item.toLowerCase() === value.toLowerCase())) {
      showToast('error', 'Skill already added.');
      return;
    }

    setSelectedSkills((prev) => [...prev, value]);
    if (!skills.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setSkills((prev) => [...prev, value].sort((a, b) => a.localeCompare(b)));
    }
    setSelectedSkill('');
  };

  const handleRemoveSkill = (skill) => {
    setSelectedSkills((prev) => prev.filter((item) => item !== skill));
  };

  const handleAddBranch = () => {
    if (!selectedBranch) return;
    if (selectedBranches.includes(selectedBranch)) {
      showToast('error', 'Branch already added.');
      return;
    }
    setSelectedBranches((prev) => [...prev, selectedBranch]);
    setSelectedBranch('');
  };

  const handleRemoveBranch = (branch) => {
    setSelectedBranches((prev) => prev.filter((item) => item !== branch));
  };

  const handleAddDomainRole = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const duplicateJobRole = rows.some(
      (row) => normalizeJobRoleName(row.job_role) === normalizeJobRoleName(form.job_role)
    );
    if (duplicateJobRole) {
      showToast('error', 'This job role already exists.');
      return;
    }

    try {
      setSaving(true);
      await domainService.addDomainJobRole({
        job_role_id: Number(jobRoleId),
        job_role: form.job_role.trim(),
        domain: form.domain.trim(),
        required_skills: selectedSkills,
        eligible_branches: selectedBranches,
      });

      setForm({ job_role: '', domain: '' });
      setSelectedSkill('');
      setSelectedSkills([]);
      setSelectedBranch('');
      setSelectedBranches([]);

      const nextIdRes = await domainService.getNextJobRoleId();
      setJobRoleId(String(nextIdRes?.data?.data?.job_role_id || ''));

      await loadPageData();
      showToast('success', 'Job role added successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to add job role.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row) => {
    setEditing({
      id: toDomainRoleId(row),
      job_role_id: row.job_role_id ?? '',
      job_role: row.job_role || '',
      domain: row.domain || '',
      required_skills: Array.isArray(row.required_skills) ? row.required_skills : [],
      eligible_branches: Array.isArray(row.eligible_branches) ? row.eligible_branches : [],
    });
    setEditSelectedSkill('');
    setEditSelectedBranch('');
  };

  const handleAddEditSkill = () => {
    const value = String(editSelectedSkill || '').trim();
    if (!value || !editing) return;

    if (editing.required_skills.some((item) => item.toLowerCase() === value.toLowerCase())) {
      showToast('error', 'Skill already added.');
      return;
    }

    setEditing((prev) => ({ ...prev, required_skills: [...prev.required_skills, value] }));
    if (!skills.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setSkills((prev) => [...prev, value].sort((a, b) => a.localeCompare(b)));
    }
    setEditSelectedSkill('');
  };

  const handleRemoveEditSkill = (skill) => {
    setEditing((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((item) => item !== skill),
    }));
  };

  const handleAddEditBranch = () => {
    if (!editSelectedBranch || !editing) return;
    if (editing.eligible_branches.includes(editSelectedBranch)) {
      showToast('error', 'Branch already added.');
      return;
    }
    setEditing((prev) => ({ ...prev, eligible_branches: [...prev.eligible_branches, editSelectedBranch] }));
    setEditSelectedBranch('');
  };

  const handleRemoveEditBranch = (branch) => {
    setEditing((prev) => ({
      ...prev,
      eligible_branches: prev.eligible_branches.filter((item) => item !== branch),
    }));
  };

  const handleUpdateDomainRole = async (event) => {
    event.preventDefault();
    if (!editing?.id) return;

    if (!editing.job_role || !editing.domain || !editing.required_skills.length || !editing.eligible_branches.length) {
      showToast('error', 'Please fill all required fields in edit form.');
      return;
    }

    const duplicateJobRole = rows.some(
      (row) =>
        String(toDomainRoleId(row)) !== String(editing.id) &&
        normalizeJobRoleName(row.job_role) === normalizeJobRoleName(editing.job_role)
    );
    if (duplicateJobRole) {
      showToast('error', 'This job role already exists.');
      return;
    }

    try {
      await domainService.updateDomainJobRole(editing.id, {
        job_role_id: Number(editing.job_role_id),
        job_role: String(editing.job_role).trim(),
        domain: String(editing.domain).trim(),
        required_skills: editing.required_skills,
        eligible_branches: editing.eligible_branches,
      });
      setEditing(null);
      await loadPageData();
      showToast('success', 'Job role updated successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to update job role.');
    }
  };

  const handleDeleteDomainRole = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this job role?')) return;

    try {
      await domainService.deleteDomainJobRole(id);
      await loadPageData();
      showToast('success', 'Job role deleted successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to delete job role.');
    }
  };

  const tableFilterOptions = useMemo(() => {
    const allDomains = [...new Set(rows.map((row) => String(row.domain || '').trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );

    const allBranches = [
      ...new Set(
        rows
          .flatMap((row) => (Array.isArray(row.eligible_branches) ? row.eligible_branches : []))
          .map((branch) => String(branch || '').trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));

    const selectedDomain = String(tableFilters.domain || '').trim().toLowerCase();
    const selectedBranch = String(tableFilters.branch || '').trim().toLowerCase();

    const domains = !selectedBranch
      ? allDomains
      : [
          ...new Set(
            rows
              .filter((row) =>
                (Array.isArray(row.eligible_branches) ? row.eligible_branches : []).some(
                  (branch) => String(branch || '').trim().toLowerCase() === selectedBranch
                )
              )
              .map((row) => String(row.domain || '').trim())
              .filter(Boolean)
          ),
        ].sort((a, b) => a.localeCompare(b));

    const branches = !selectedDomain
      ? allBranches
      : [
          ...new Set(
            rows
              .filter((row) => String(row.domain || '').trim().toLowerCase() === selectedDomain)
              .flatMap((row) => (Array.isArray(row.eligible_branches) ? row.eligible_branches : []))
              .map((branch) => String(branch || '').trim())
              .filter(Boolean)
          ),
        ].sort((a, b) => a.localeCompare(b));

    return {
      domains,
      branches,
    };
  }, [rows, tableFilters.domain, tableFilters.branch]);

  useEffect(() => {
    if (tableFilters.domain && !tableFilterOptions.domains.includes(tableFilters.domain)) {
      setTableFilters((prev) => ({ ...prev, domain: '' }));
    }

    if (tableFilters.branch && !tableFilterOptions.branches.includes(tableFilters.branch)) {
      setTableFilters((prev) => ({ ...prev, branch: '' }));
    }
  }, [tableFilters.domain, tableFilters.branch, tableFilterOptions.domains, tableFilterOptions.branches]);

  const handleTableFilterChange = (field, value) => {
    setTableFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const resetTableFilters = () => {
    setTableFilters({
      domain: '',
      branch: '',
    });
    setCurrentPage(1);
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const jobRole = String(row.job_role || '').toLowerCase();
      const domain = String(row.domain || '').trim();
      const eligibleBranches = Array.isArray(row.eligible_branches) ? row.eligible_branches : [];

      if (tableFilters.domain && domain.toLowerCase() !== tableFilters.domain.toLowerCase()) {
        return false;
      }

      if (
        tableFilters.branch &&
        !eligibleBranches.some((branch) => String(branch || '').trim().toLowerCase() === tableFilters.branch.toLowerCase())
      ) {
        return false;
      }

      if (!query) return true;
      return jobRole.includes(query) || domain.toLowerCase().includes(query);
    });
  }, [rows, search, tableFilters]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 2) {
      return [1, 2, 3];
    }

    if (currentPage >= totalPages - 1) {
      return [totalPages - 2, totalPages - 1, totalPages];
    }

    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, tableFilters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const availableSkills = useMemo(
    () => skills.filter((item) => !selectedSkills.includes(item)),
    [skills, selectedSkills]
  );

  const availableBranches = useMemo(
    () => branches.filter((item) => !selectedBranches.includes(item)),
    [branches, selectedBranches]
  );

  const availableEditSkills = useMemo(() => {
    const selected = Array.isArray(editing?.required_skills) ? editing.required_skills : [];
    return skills.filter((item) => !selected.includes(item));
  }, [skills, editing]);

  const availableEditBranches = useMemo(() => {
    const selected = Array.isArray(editing?.eligible_branches) ? editing.eligible_branches : [];
    return branches.filter((item) => !selected.includes(item));
  }, [branches, editing]);

  const columns = useMemo(
    () => [
      { key: 'job_role_id', header: 'Job Role ID', width: '10%' },
      { key: 'job_role', header: 'Job Role Name', width: '18%' },
      { key: 'domain', header: 'Domain', width: '14%' },
      {
        key: 'required_skills',
        header: 'Skills',
        width: '23%',
        render: (row) => (
          <div className="flex max-h-16 flex-wrap gap-1 overflow-y-auto pr-1">
            {(row.required_skills || []).map((item) => (
              <span key={item} className="inline-flex rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {item}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'eligible_branches',
        header: 'Branches',
        width: '23%',
        render: (row) => (
          <div className="flex max-h-16 flex-wrap gap-1 overflow-y-auto pr-1">
            {(row.eligible_branches || []).map((item) => (
              <span key={item} className="inline-flex rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {item}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        width: '12%',
        render: (row) => (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => startEdit(row)}
              aria-label="Edit"
              title="Edit"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteDomainRole(toDomainRoleId(row))}
              aria-label="Delete"
              title="Delete"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  if (!isMain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="mx-auto mt-24 max-w-xl rounded-xl border border-rose-200 bg-white p-8 text-center shadow-md">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-rose-500" />
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-600">Only Main TPO can manage job roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {toast && (
        <div className="fixed right-4 top-4 z-[10050]">
          <div
            className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <Sidebar />

      <main className="relative px-4 py-6 lg:ml-72 lg:px-8 lg:py-8">
        <header className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Manage Job Roles</h2>
          <p className="mt-1 text-sm text-gray-600">Add and manage job roles with domains, skills, and branches</p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900">Add Job Role</h3>

            <form onSubmit={handleAddDomainRole} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Job Role ID</label>
                <input
                  value={jobRoleId}
                  readOnly
                  className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                  placeholder="Auto-generated"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Job Role Name</label>
                <input
                  value={form.job_role}
                  onChange={(event) => setForm((prev) => ({ ...prev, job_role: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Backend Developer"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Domain</label>
                <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr]">
                  <input
                    list="domain-options"
                    value={form.domain}
                    onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Software Development"
                  />
                  <datalist id="domain-options">
                    {domains.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>

                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Required Skills</label>
                <div className="mt-1 flex gap-2">
                  <input
                    list="skill-options"
                    value={selectedSkill}
                    onChange={(event) => setSelectedSkill(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Select or type a new skill"
                  />
                  <datalist id="skill-options">
                    {availableSkills.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={!selectedSkill.trim()}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSkills.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(item)}
                        className="rounded-full p-0.5 text-blue-700 hover:bg-blue-200"
                        aria-label={`Remove ${item}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Eligible Branches</label>
                <div className="mt-1 flex gap-2">
                  <select
                    value={selectedBranch}
                    onChange={(event) => setSelectedBranch(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select Branch</option>
                    {availableBranches.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddBranch}
                    className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-indigo-700 hover:to-purple-700"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedBranches.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveBranch(item)}
                        className="rounded-full p-0.5 text-indigo-700 hover:bg-indigo-200"
                        aria-label={`Remove ${item}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Adding...' : 'Add Job Role'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">All Job Roles</h3>
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by job role or domain"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select
              value={tableFilters.domain}
              onChange={(event) => handleTableFilterChange('domain', event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">All Domains</option>
              {tableFilterOptions.domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>

            <select
              value={tableFilters.branch}
              onChange={(event) => handleTableFilterChange('branch', event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">All Branches</option>
              {tableFilterOptions.branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetTableFilters}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>

          {loading ? (
            <div className="h-36 animate-pulse rounded-xl bg-slate-100" />
          ) : (
            <>
              <Table columns={columns} rows={paginatedRows} emptyLabel="No job roles found." />

              {filteredRows.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRows.length)} of {filteredRows.length}
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ←
                    </button>

                    {visiblePages.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {editing && (
          <div className="fixed inset-y-0 left-0 right-0 z-[9999] bg-black/50 flex items-center justify-center p-4 sm:p-6 lg:left-72 overflow-hidden">
            <div className="w-[90%] max-w-[800px] rounded-2xl bg-white shadow-2xl max-h-[88vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Edit Job Role</h3>
                  <p className="text-sm text-gray-500 mt-1">Update job role details and requirements</p>
                </div>
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 transition flex-shrink-0">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateDomainRole} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Role ID</label>
                      <input
                        value={editing.job_role_id}
                        readOnly
                        className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Role</label>
                      <input
                        value={editing.job_role}
                        readOnly
                        className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                    <input
                      value={editing.domain}
                      readOnly
                      className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Required Skills</h4>
                  <div className="flex gap-2">
                    <input
                      list="edit-skill-options"
                      value={editSelectedSkill}
                      onChange={(event) => setEditSelectedSkill(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleAddEditSkill();
                        }
                      }}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                      placeholder="Select or type a new skill"
                    />
                    <datalist id="edit-skill-options">
                      {availableEditSkills.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                    <button
                      type="button"
                      onClick={handleAddEditSkill}
                      disabled={!editSelectedSkill.trim()}
                      className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                  {editing.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                      {editing.required_skills.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800 shadow-sm"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => handleRemoveEditSkill(item)}
                            className="rounded-full p-0.5 text-blue-600 hover:bg-blue-200 transition"
                            aria-label={`Remove ${item}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Eligible Branches</h4>
                  <div className="flex gap-2">
                    <select
                      value={editSelectedBranch}
                      onChange={(event) => setEditSelectedBranch(event.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                    >
                      <option value="">Select Branch</option>
                      {availableEditBranches.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddEditBranch}
                      className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                  {editing.eligible_branches.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-indigo-50 rounded-lg">
                      {editing.eligible_branches.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-800 shadow-sm"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => handleRemoveEditBranch(item)}
                            className="rounded-full p-0.5 text-indigo-600 hover:bg-indigo-200 transition"
                            aria-label={`Remove ${item}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
                  >
                    Update Job Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
