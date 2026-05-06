import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Edit2,
  GraduationCap,
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
import { tpoService } from '../../services/api';
import Table from '../../components/tpo/Table';
import Sidebar from '../../components/Sidebar';

function getInitials(nameOrEmail) {
  if (!nameOrEmail || typeof nameOrEmail !== 'string') return 'TP';
  const tokens = nameOrEmail.trim().split(/\s+/);
  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

function normalizePlacementRecordsResponse(payload) {
  const source = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.records)
      ? payload.records
      : Array.isArray(payload)
        ? payload
        : [];

  return source.map((item) => ({
    id: item?.id || item?._id,
    student_id: item?.student_id || '',
    branch: item?.branch || '',
    cgpa: item?.cgpa,
    backlogs: item?.backlogs,
    placement_year: item?.placement_year,
    placed_status: Boolean(item?.placed_status),
    company_name: item?.company_name || '',
    package_lpa: item?.package_lpa,
    domain: typeof item?.domain === 'string' ? item.domain.trim() : '',
    job_role: typeof item?.job_role === 'string' ? item.job_role.trim() : '',
  }));
}

function toRecordId(record) {
  return record?.id || record?._id;
}

function normalizeOptionsResponse(payload) {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function normalizeStudentId(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase();
}

export default function ManagePlacementRecords() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const normalizedRole = normalizeRole(user.role);
  const isMain = normalizedRole === ROLES.MAIN_TPO;
  const isBranch = normalizedRole === ROLES.BRANCH_TPO;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [yearOptions, setYearOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [domainOptions, setDomainOptions] = useState([]);
  const [jobRoleOptions, setJobRoleOptions] = useState([]);
  const [editCompanyOptions, setEditCompanyOptions] = useState([]);
  const [editDomainOptions, setEditDomainOptions] = useState([]);
  const [editJobRoleOptions, setEditJobRoleOptions] = useState([]);
  const [tableFilters, setTableFilters] = useState({
    year: '',
    status: '',
    company: '',
    domain: '',
    jobRole: '',
  });
  const [form, setForm] = useState({
    student_id: '',
    cgpa: '',
    backlogs: '',
    placement_year: String(new Date().getFullYear()),
    placed_status: 'true',
    company_name: '',
    package_lpa: '',
    domain: '',
    job_role: '',
  });

  const displayName = useMemo(() => user.email?.split('@')[0] || 'TPO User', [user.email]);
  const roleLabel = isMain ? 'Main TPO' : 'Branch TPO';

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(showToast.timerId);
    showToast.timerId = window.setTimeout(() => setToast(null), 2800);
  };

  const loadYearOptions = async () => {
    try {
      const response = await tpoService.getPlacementRecordYearOptions();
      const years = normalizeOptionsResponse(response?.data)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .sort((left, right) => right - left);

      const currentYear = Number(new Date().getFullYear());
      const mergedYears = years.includes(currentYear) ? years : [currentYear, ...years];
      setYearOptions(Array.from(new Set(mergedYears)));
    } catch (error) {
      setYearOptions([Number(new Date().getFullYear())]);
      showToast('error', error?.response?.data?.message || 'Failed to load placement years.');
    }
  };

  const loadCompanyOptions = async (year) => {
    if (!year) {
      setCompanyOptions([]);
      return;
    }

    try {
      const response = await tpoService.getPlacementRecordCompanyOptions(year);
      setCompanyOptions(normalizeOptionsResponse(response?.data));
    } catch (error) {
      setCompanyOptions([]);
      showToast('error', error?.response?.data?.message || 'Failed to load company options.');
    }
  };

  const loadDomainOptions = async (year, companyName) => {
    if (!year || !companyName) {
      setDomainOptions([]);
      return;
    }

    try {
      const response = await tpoService.getPlacementRecordDomainOptions(year, companyName);
      setDomainOptions(normalizeOptionsResponse(response?.data));
    } catch (error) {
      setDomainOptions([]);
      showToast('error', error?.response?.data?.message || 'Failed to load domain options.');
    }
  };

  const loadJobRoleOptions = async (domain) => {
    if (!domain) {
      setJobRoleOptions([]);
      return;
    }

    try {
      const response = await tpoService.getPlacementRecordJobRoleOptions(domain);
      setJobRoleOptions(normalizeOptionsResponse(response?.data));
    } catch (error) {
      setJobRoleOptions([]);
      showToast('error', error?.response?.data?.message || 'Failed to load job role options.');
    }
  };

  const loadEditCompanyOptions = async (year) => {
    if (!year) {
      setEditCompanyOptions([]);
      return;
    }

    try {
      const response = await tpoService.getPlacementRecordCompanyOptions(year);
      setEditCompanyOptions(normalizeOptionsResponse(response?.data));
    } catch (error) {
      setEditCompanyOptions([]);
      showToast('error', error?.response?.data?.message || 'Failed to load company options.');
    }
  };

  const loadEditDomainOptions = async (year, companyName) => {
    if (!year || !companyName) {
      setEditDomainOptions([]);
      return;
    }

    try {
      const response = await tpoService.getPlacementRecordDomainOptions(year, companyName);
      setEditDomainOptions(normalizeOptionsResponse(response?.data));
    } catch (error) {
      setEditDomainOptions([]);
      showToast('error', error?.response?.data?.message || 'Failed to load domain options.');
    }
  };

  const loadEditJobRoleOptions = async (domain) => {
    if (!domain) {
      setEditJobRoleOptions([]);
      return;
    }

    try {
      const response = await tpoService.getPlacementRecordJobRoleOptions(domain);
      setEditJobRoleOptions(normalizeOptionsResponse(response?.data));
    } catch (error) {
      setEditJobRoleOptions([]);
      showToast('error', error?.response?.data?.message || 'Failed to load job role options.');
    }
  };

  const validateEditForm = () => {
    const requiredFields = ['student_id', 'cgpa', 'backlogs', 'placement_year', 'placed_status'];

    for (const key of requiredFields) {
      if (!String(editing?.[key] ?? '').trim()) {
        showToast('error', 'Please fill all required fields in edit form.');
        return false;
      }
    }

    if (editing.placed_status === 'true') {
      const placedRequiredFields = ['company_name', 'domain', 'job_role', 'package_lpa'];
      for (const key of placedRequiredFields) {
        if (!String(editing?.[key] ?? '').trim()) {
          showToast('error', 'Please fill all required fields in edit form.');
          return false;
        }
      }

      if (!editCompanyOptions.includes(editing.company_name)) {
        showToast('error', 'Please select a valid company for the selected year in edit form.');
        return false;
      }

      if (!editDomainOptions.includes(editing.domain)) {
        showToast('error', 'Please select a valid domain for the selected company in edit form.');
        return false;
      }

      if (!editJobRoleOptions.includes(editing.job_role)) {
        showToast('error', 'Please select a valid job role for the selected domain in edit form.');
        return false;
      }
    } else if (editing.company_name || editing.domain || editing.job_role || String(editing.package_lpa || '').trim()) {
      showToast('error', 'Select Placed status before filling company details in edit form.');
      return false;
    }

    return true;
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await tpoService.getPlacementRecords();
      const normalized = normalizePlacementRecordsResponse(response?.data);
      console.log('[ManagePlacementRecords] API raw payload:', response?.data);
      console.log('[ManagePlacementRecords] Normalized records sample:', normalized.slice(0, 5));
      setRows(normalized);
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to load placement records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadYearOptions();
    fetchRecords();
  }, []);

  useEffect(() => {
    if (!yearOptions.length) return;

    setForm((prev) => {
      const currentYear = Number(prev.placement_year);
      const nextYear = yearOptions.includes(currentYear) ? currentYear : yearOptions[0];
      if (String(nextYear) === String(prev.placement_year)) return prev;

      return {
        ...prev,
        placement_year: String(nextYear),
        company_name: '',
        domain: '',
        job_role: '',
      };
    });
  }, [yearOptions]);

  useEffect(() => {
    loadCompanyOptions(form.placement_year);
  }, [form.placement_year]);

  useEffect(() => {
    loadDomainOptions(form.placement_year, form.company_name);
  }, [form.placement_year, form.company_name]);

  useEffect(() => {
    loadJobRoleOptions(form.domain);
  }, [form.domain]);

  useEffect(() => {
    if (!editing) return;
    loadEditCompanyOptions(editing.placement_year);
  }, [editing?.placement_year]);

  useEffect(() => {
    if (!editing) return;
    loadEditDomainOptions(editing.placement_year, editing.company_name);
  }, [editing?.placement_year, editing?.company_name]);

  useEffect(() => {
    if (!editing) return;
    loadEditJobRoleOptions(editing.domain);
  }, [editing?.domain]);

  const handleLogout = () => {
    authUtils.clearAuthData();
    navigate('/login');
  };

  const validateManualForm = () => {
    const requiredFields = ['student_id', 'cgpa', 'backlogs', 'placement_year', 'placed_status'];
    for (const key of requiredFields) {
      if (!String(form[key] || '').trim()) {
        showToast('error', 'Please fill all required fields.');
        return false;
      }
    }

    if (form.placed_status === 'true') {
      const placedRequiredFields = ['company_name', 'domain', 'job_role', 'package_lpa'];
      for (const key of placedRequiredFields) {
        if (!String(form[key] || '').trim()) {
          showToast('error', 'Please fill all required fields.');
          return false;
        }
      }

      if (!companyOptions.includes(form.company_name)) {
        showToast('error', 'Please select a valid company for the selected year.');
        return false;
      }

      if (!domainOptions.includes(form.domain)) {
        showToast('error', 'Please select a valid domain for the selected company.');
        return false;
      }

      if (!jobRoleOptions.includes(form.job_role)) {
        showToast('error', 'Please select a valid job role for the selected domain.');
        return false;
      }
    } else if (form.company_name || form.domain || form.job_role || String(form.package_lpa || '').trim()) {
      showToast('error', 'Select Placed status before filling company details.');
      return false;
    }

    return true;
  };

  const handleAddRecord = async (event) => {
    event.preventDefault();
    if (!validateManualForm()) return;

    const duplicateExists = rows.some((row) => {
      return (
        normalizeStudentId(row.student_id) === normalizeStudentId(form.student_id) &&
        Number(row.placement_year) === Number(form.placement_year)
      );
    });

    if (duplicateExists) {
      showToast('error', 'Placement record for this student exists.');
      return;
    }

    try {
      setSaving(true);
      await tpoService.addPlacementRecord({
        student_id: form.student_id.trim(),
        cgpa: Number(form.cgpa),
        backlogs: Number(form.backlogs),
        placement_year: Number(form.placement_year),
        placed_status: form.placed_status === 'true',
        company_name: form.company_name.trim(),
        package_lpa: Number(form.package_lpa || 0),
        domain: form.domain.trim(),
        job_role: form.job_role.trim(),
      });

      setForm({
        student_id: '',
        cgpa: '',
        backlogs: '',
        placement_year: String(new Date().getFullYear()),
        placed_status: 'true',
        company_name: '',
        package_lpa: '',
        domain: '',
        job_role: '',
      });

      await fetchRecords();
      showToast('success', 'Placement record added successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to add placement record.');
    } finally {
      setSaving(false);
    }
  };

  const handlePlacementYearChange = (event) => {
    const nextYear = event.target.value;
    setForm((prev) => ({
      ...prev,
      placement_year: nextYear,
      company_name: '',
      domain: '',
      job_role: '',
    }));
    setCompanyOptions([]);
    setDomainOptions([]);
    setJobRoleOptions([]);
  };

  const handleCompanyNameChange = (event) => {
    const nextCompany = event.target.value;
    setForm((prev) => ({
      ...prev,
      company_name: nextCompany,
      domain: '',
      job_role: '',
    }));
    setDomainOptions([]);
    setJobRoleOptions([]);
  };

  const handleDomainChange = (event) => {
    const nextDomain = event.target.value;
    setForm((prev) => ({
      ...prev,
      domain: nextDomain,
      job_role: '',
    }));
    setJobRoleOptions([]);
  };

  const handlePlacedStatusChange = (event) => {
    const nextStatus = event.target.value;
    setForm((prev) => ({
      ...prev,
      placed_status: nextStatus,
      ...(nextStatus === 'false'
        ? {
            company_name: '',
            package_lpa: '',
            domain: '',
            job_role: '',
          }
        : {}),
    }));

  };

  const handleEditPlacementYearChange = (event) => {
    const nextYear = event.target.value;
    setEditing((prev) => ({
      ...prev,
      placement_year: nextYear,
      company_name: '',
      domain: '',
      job_role: '',
    }));
    setEditCompanyOptions([]);
    setEditDomainOptions([]);
    setEditJobRoleOptions([]);
  };

  const handleEditCompanyNameChange = (event) => {
    const nextCompany = event.target.value;
    setEditing((prev) => ({
      ...prev,
      company_name: nextCompany,
      domain: '',
      job_role: '',
    }));
    setEditDomainOptions([]);
    setEditJobRoleOptions([]);
  };

  const handleEditDomainChange = (event) => {
    const nextDomain = event.target.value;
    setEditing((prev) => ({
      ...prev,
      domain: nextDomain,
      job_role: '',
    }));
    setEditJobRoleOptions([]);
  };

  const handleEditPlacedStatusChange = (event) => {
    const nextStatus = event.target.value;
    setEditing((prev) => ({
      ...prev,
      placed_status: nextStatus,
      ...(nextStatus === 'false'
        ? {
            company_name: '',
            package_lpa: '',
            domain: '',
            job_role: '',
          }
        : {}),
    }));

  };

  const startEdit = (row) => {
    setEditing({
      id: toRecordId(row),
      student_id: row.student_id || '',
      cgpa: row.cgpa ?? '',
      backlogs: row.backlogs ?? '',
      placement_year: row.placement_year ?? '',
      placed_status: row.placed_status ? 'true' : 'false',
      company_name: row.company_name || '',
      package_lpa: row.package_lpa ?? '',
      domain: row.domain || '',
      job_role: row.job_role || '',
    });
  };

  const handleUpdateRecord = async (event) => {
    event.preventDefault();
    if (!editing?.id) return;

    if (!validateEditForm()) return;

    try {
      setSaving(true);
      await tpoService.updatePlacementRecord(editing.id, {
        student_id: String(editing.student_id).trim(),
        cgpa: Number(editing.cgpa),
        backlogs: Number(editing.backlogs),
        placement_year: Number(editing.placement_year),
        placed_status: editing.placed_status === 'true',
        company_name: String(editing.company_name || '').trim(),
        package_lpa: Number(editing.package_lpa || 0),
        domain: String(editing.domain || '').trim(),
        job_role: String(editing.job_role || '').trim(),
      });

      setEditing(null);
      await fetchRecords();
      showToast('success', 'Placement record updated successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to update placement record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this placement record?')) return;

    try {
      await tpoService.deletePlacementRecord(id);
      await fetchRecords();
      showToast('success', 'Placement record deleted successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to delete placement record.');
    }
  };

  const tableFilterOptions = useMemo(() => {
    const selected = {
      year: String(tableFilters.year || '').trim(),
      status: String(tableFilters.status || '').trim(),
      company: String(tableFilters.company || '').trim().toLowerCase(),
      domain: String(tableFilters.domain || '').trim().toLowerCase(),
      jobRole: String(tableFilters.jobRole || '').trim().toLowerCase(),
    };

    const getRowStatus = (row) => (row.placed_status ? 'Placed' : 'Not Placed');

    const matchesOtherFilters = (row, targetField) => {
      const rowYear = String(row.placement_year || '').trim();
      const rowStatus = getRowStatus(row);
      const rowCompany = String(row.company_name || '').trim().toLowerCase();
      const rowDomain = String(row.domain || '').trim().toLowerCase();
      const rowJobRole = String(row.job_role || '').trim().toLowerCase();

      if (targetField !== 'year' && selected.year && rowYear !== selected.year) return false;
      if (targetField !== 'status' && selected.status && rowStatus !== selected.status) return false;
      if (targetField !== 'company' && selected.company && rowCompany !== selected.company) return false;
      if (targetField !== 'domain' && selected.domain && rowDomain !== selected.domain) return false;
      if (targetField !== 'jobRole' && selected.jobRole && rowJobRole !== selected.jobRole) return false;

      return true;
    };

    const years = [
      ...new Set(
        rows
          .filter((row) => matchesOtherFilters(row, 'year'))
          .map((row) => String(row.placement_year || '').trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => Number(b) - Number(a));

    const statuses = [
      ...new Set(
        rows
          .filter((row) => matchesOtherFilters(row, 'status'))
          .map((row) => getRowStatus(row))
          .filter(Boolean)
      ),
    ];

    const companies = [
      ...new Set(
        rows
          .filter((row) => matchesOtherFilters(row, 'company'))
          .map((row) => String(row.company_name || '').trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));

    const domains = [
      ...new Set(
        rows
          .filter((row) => matchesOtherFilters(row, 'domain'))
          .map((row) => String(row.domain || '').trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));

    const jobRoles = [
      ...new Set(
        rows
          .filter((row) => matchesOtherFilters(row, 'jobRole'))
          .map((row) => String(row.job_role || '').trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));

    return {
      years,
      statuses,
      companies,
      domains,
      jobRoles,
    };
  }, [rows, tableFilters.year, tableFilters.status, tableFilters.company, tableFilters.domain, tableFilters.jobRole]);

  useEffect(() => {
    if (tableFilters.year && !tableFilterOptions.years.includes(tableFilters.year)) {
      setTableFilters((prev) => ({ ...prev, year: '' }));
    }

    if (tableFilters.status && !tableFilterOptions.statuses.includes(tableFilters.status)) {
      setTableFilters((prev) => ({ ...prev, status: '' }));
    }

    if (tableFilters.company && !tableFilterOptions.companies.includes(tableFilters.company)) {
      setTableFilters((prev) => ({ ...prev, company: '' }));
    }

    if (tableFilters.domain && !tableFilterOptions.domains.includes(tableFilters.domain)) {
      setTableFilters((prev) => ({ ...prev, domain: '' }));
    }

    if (tableFilters.jobRole && !tableFilterOptions.jobRoles.includes(tableFilters.jobRole)) {
      setTableFilters((prev) => ({ ...prev, jobRole: '' }));
    }
  }, [
    tableFilters.year,
    tableFilters.status,
    tableFilters.company,
    tableFilters.domain,
    tableFilters.jobRole,
    tableFilterOptions.years,
    tableFilterOptions.statuses,
    tableFilterOptions.companies,
    tableFilterOptions.domains,
    tableFilterOptions.jobRoles,
  ]);

  const handleTableFilterChange = (field, value) => {
    setTableFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const resetTableFilters = () => {
    setTableFilters({
      year: '',
      status: '',
      company: '',
      domain: '',
      jobRole: '',
    });
    setCurrentPage(1);
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (tableFilters.year && String(row.placement_year || '') !== tableFilters.year) return false;

      if (tableFilters.status) {
        const rowStatus = row.placed_status ? 'Placed' : 'Not Placed';
        if (rowStatus !== tableFilters.status) return false;
      }

      if (tableFilters.company && String(row.company_name || '').trim().toLowerCase() !== tableFilters.company.toLowerCase()) {
        return false;
      }

      if (tableFilters.domain && String(row.domain || '').trim().toLowerCase() !== tableFilters.domain.toLowerCase()) {
        return false;
      }

      if (tableFilters.jobRole && String(row.job_role || '').trim().toLowerCase() !== tableFilters.jobRole.toLowerCase()) {
        return false;
      }

      if (!query) return true;

      return (
        String(row.student_id || '').toLowerCase().includes(query) ||
        String(row.company_name || '').toLowerCase().includes(query) ||
        String(row.job_role || '').toLowerCase().includes(query)
      );
    });

    return filtered.sort((a, b) => Number(b.placement_year || 0) - Number(a.placement_year || 0));
  }, [rows, search, tableFilters]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];
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

  const columns = useMemo(
    () => [
      { key: 'student_id', header: 'Student ID', width: '12%' },
      { key: 'cgpa', header: 'CGPA', width: '8%' },
      { key: 'backlogs', header: 'Backlogs', width: '9%' },
      { key: 'placement_year', header: 'Year', width: '8%' },
      {
        key: 'placed_status',
        header: 'Status',
        width: '11%',
        render: (row) => (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.placed_status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
            {row.placed_status ? 'Placed' : 'Not Placed'}
          </span>
        ),
      },
      { key: 'company_name', header: 'Company', width: '16%' },
      {
        key: 'package_lpa',
        header: 'Package',
        width: '10%',
        render: (row) => (Number.isFinite(Number(row.package_lpa)) ? Number(row.package_lpa).toFixed(2) : '-'),
      },
      {
        key: 'domain',
        header: 'Domain',
        width: '13%',
        render: (row) => {
          if (!row.placed_status) return 'N/A';
          const value = String(row.domain || '').trim();
          return value || '-';
        },
      },
      {
        key: 'job_role',
        header: 'Job Role',
        width: '13%',
        render: (row) => {
          if (!row.placed_status) return 'N/A';
          const value = String(row.job_role || '').trim();
          return value || '-';
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        width: '10%',
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
              onClick={() => handleDeleteRecord(toRecordId(row))}
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

  if (!isMain && !isBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="mx-auto mt-24 max-w-xl rounded-xl border border-rose-200 bg-white p-8 text-center shadow-md">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-rose-500" />
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-600">Only TPO users can access placement records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {toast && (
        <div className="fixed right-4 top-4 z-[10050]">
          <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <Sidebar />

      <main className="px-4 py-6 lg:ml-72 lg:px-8 lg:py-8">
        <header className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Manage Placement Records</h2>
          <p className="mt-1 text-sm text-gray-600">Manage branch-wise placement data manually or via CSV</p>
        </header>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">Manual Entry</h3>
          <form onSubmit={handleAddRecord} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Student ID</label>
              <input
                value={form.student_id}
                onChange={(event) => setForm((prev) => ({ ...prev, student_id: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="22CE101"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">CGPA</label>
              <input
                type="number"
                step="0.01"
                value={form.cgpa}
                onChange={(event) => setForm((prev) => ({ ...prev, cgpa: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="7.50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Backlogs</label>
              <input
                type="number"
                value={form.backlogs}
                onChange={(event) => setForm((prev) => ({ ...prev, backlogs: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Placement Year</label>
              <select
                value={form.placement_year}
                onChange={handlePlacementYearChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select Year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.placed_status}
                onChange={handlePlacedStatusChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="true">Placed</option>
                <option value="false">Not Placed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Company Name</label>
              <select
                value={form.company_name}
                onChange={handleCompanyNameChange}
                disabled={!form.placement_year || companyOptions.length === 0}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">{companyOptions.length ? 'Select Company' : 'No companies available'}</option>
                {companyOptions.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Package (LPA)</label>
              <input
                type="number"
                step="0.01"
                value={form.package_lpa}
                onChange={(event) => setForm((prev) => ({ ...prev, package_lpa: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="6.80"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Domain</label>
              <select
                value={form.domain}
                onChange={handleDomainChange}
                disabled={!form.company_name || domainOptions.length === 0}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">{domainOptions.length ? 'Select Domain' : 'No domains available'}</option>
                {domainOptions.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Job Role</label>
              <select
                value={form.job_role}
                onChange={(event) => setForm((prev) => ({ ...prev, job_role: event.target.value }))}
                disabled={!form.domain || jobRoleOptions.length === 0}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">{jobRoleOptions.length ? 'Select Job Role' : 'No job roles available'}</option>
                {jobRoleOptions.map((jobRole) => (
                  <option key={jobRole} value={jobRole}>
                    {jobRole}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving || !isBranch}
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add Record
              </button>
            </div>
          </form>
          {!isBranch && (
            <p className="mt-2 text-xs text-amber-600">Manual add is available only for Branch TPO accounts.</p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Placement Records</h3>
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by student ID, company or job role"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <select
              value={tableFilters.year}
              onChange={(event) => handleTableFilterChange('year', event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">All Years</option>
              {tableFilterOptions.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={tableFilters.status}
              onChange={(event) => handleTableFilterChange('status', event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">All Status</option>
              {tableFilterOptions.statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={tableFilters.company}
              onChange={(event) => handleTableFilterChange('company', event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">All Companies</option>
              {tableFilterOptions.companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>

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
              value={tableFilters.jobRole}
              onChange={(event) => handleTableFilterChange('jobRole', event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">All Job Roles</option>
              {tableFilterOptions.jobRoles.map((jobRole) => (
                <option key={jobRole} value={jobRole}>
                  {jobRole}
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
              <Table columns={columns} rows={paginatedRows} emptyLabel="No placement records found." />

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
                          currentPage === page ? 'bg-blue-600 text-white shadow' : 'text-slate-700 hover:bg-slate-100'
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
      </main>

      {editing && (
        <div className="fixed inset-y-0 left-0 right-0 z-[9999] bg-black/50 flex items-center justify-center p-4 sm:p-6 lg:left-72 overflow-hidden">
          <div className="w-[90%] max-w-[800px] rounded-2xl bg-white shadow-2xl max-h-[88vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Edit Placement Record</h3>
                <p className="text-sm text-gray-500 mt-1">Update placement details</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 transition flex-shrink-0">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="flex-1 overflow-y-auto p-8 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Student ID</label>
                  <input
                    value={editing.student_id}
                    readOnly
                    className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.cgpa}
                    onChange={(event) => setEditing((prev) => ({ ...prev, cgpa: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Backlogs</label>
                  <input
                    type="number"
                    value={editing.backlogs}
                    onChange={(event) => setEditing((prev) => ({ ...prev, backlogs: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Year</label>
                  <select
                    value={editing.placement_year}
                    onChange={handleEditPlacementYearChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select Year</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editing.placed_status}
                    onChange={handleEditPlacedStatusChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="true">Placed</option>
                    <option value="false">Not Placed</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Company</label>
                  <select
                    value={editing.company_name}
                    onChange={handleEditCompanyNameChange}
                    disabled={!editing.placement_year || editCompanyOptions.length === 0}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">{editCompanyOptions.length ? 'Select Company' : 'No companies available'}</option>
                    {editCompanyOptions.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Package (LPA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.package_lpa}
                    onChange={(event) => setEditing((prev) => ({ ...prev, package_lpa: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Domain</label>
                  <select
                    value={editing.domain}
                    onChange={handleEditDomainChange}
                    disabled={!editing.company_name || editDomainOptions.length === 0}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">{editDomainOptions.length ? 'Select Domain' : 'No domains available'}</option>
                    {editDomainOptions.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Job Role</label>
                  <select
                    value={editing.job_role}
                    onChange={(event) => setEditing((prev) => ({ ...prev, job_role: event.target.value }))}
                    disabled={!editing.domain || editJobRoleOptions.length === 0}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">{editJobRoleOptions.length ? 'Select Job Role' : 'No job roles available'}</option>
                    {editJobRoleOptions.map((jobRole) => (
                      <option key={jobRole} value={jobRole}>
                        {jobRole}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving || !isBranch}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Update Record
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
    </div>
  );
}
