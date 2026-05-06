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
import { getCurrentUser, normalizeRole, ROLES } from '../../utils/tpo/roles';
import { authUtils } from '../../utils/auth';
import { companyService } from '../../services/api';
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

function normalizeCompaniesResponse(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.companies)) return payload.companies;
  if (Array.isArray(payload)) return payload;
  return [];
}

function toCompanyId(company) {
  return company?.id || company?._id || company?.company_id;
}

function normalizeCompanyName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export default function ManageCompany() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isMain = normalizeRole(user.role) === ROLES.MAIN_TPO;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [domains, setDomains] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editSelectedDomain, setEditSelectedDomain] = useState('');
  const [tableFilters, setTableFilters] = useState({
    companyName: '',
    year: '',
    domain: '',
  });
  const [form, setForm] = useState({
    company_name: '',
    required_cgpa: '',
    year: String(new Date().getFullYear()),
  });

  const displayName = useMemo(() => user.email?.split('@')[0] || 'TPO User', [user.email]);
  const roleLabel = isMain ? 'Main TPO' : 'Branch TPO';

  useEffect(() => {
    if (!isMain) return;
    const loadPageData = async () => {
      try {
        setLoading(true);
        const [companiesRes, domainsRes, nextIdRes] = await Promise.all([
          companyService.getCompanies(),
          companyService.getDomains(),
          companyService.getNextCompanyId(),
        ]);
        setRows(normalizeCompaniesResponse(companiesRes?.data));

        const domainPayload = domainsRes?.data?.data;
        if (Array.isArray(domainPayload)) {
          setDomains(domainPayload);
        } else {
          setDomains([]);
        }

        setCompanyId(nextIdRes?.data?.data?.company_id || '');
      } catch (error) {
        showToast('error', error?.response?.data?.message || 'Failed to load company data.');
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [isMain]);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(showToast.timerId);
    showToast.timerId = window.setTimeout(() => setToast(null), 2800);
  };

  const refreshCompanies = async () => {
    const res = await companyService.getCompanies();
    setRows(normalizeCompaniesResponse(res?.data));
  };

  const handleLogout = () => {
    authUtils.clearAuthData();
    navigate('/login');
  };

  const validateManualForm = () => {
    const requiredFields = ['company_name', 'required_cgpa', 'year'];
    for (const key of requiredFields) {
      if (!String(form[key] || '').trim()) {
        showToast('error', 'Please fill all required fields.');
        return false;
      }
    }

    if (!companyId) {
      showToast('error', 'Unable to generate company ID. Please refresh the page.');
      return false;
    }

    if (!Array.isArray(selectedDomains) || selectedDomains.length === 0) {
      showToast('error', 'Please select at least one domain.');
      return false;
    }

    return true;
  };

  const handleAddCompany = async (event) => {
    event.preventDefault();
    if (!validateManualForm()) return;

    const duplicateForYear = rows.some(
      (row) =>
        Number(row.year) === Number(form.year) &&
        normalizeCompanyName(row.company_name) === normalizeCompanyName(form.company_name)
    );

    if (duplicateForYear) {
      showToast('error', 'This company is already added for the selected year.');
      return;
    }

    try {
      setSaving(true);
      await companyService.addCompany({
        company_id: companyId,
        company_name: form.company_name.trim(),
        required_cgpa: Number(form.required_cgpa),
        minimum_pkg: 0,
        max_pkg: 0,
        year: Number(form.year),
        domain: selectedDomains,
      });

      setForm({
        company_name: '',
        required_cgpa: '',
        year: String(new Date().getFullYear()),
      });
      setSelectedDomain('');
      setSelectedDomains([]);
      const nextIdRes = await companyService.getNextCompanyId();
      setCompanyId(nextIdRes?.data?.data?.company_id || '');
      await refreshCompanies();
      showToast('success', 'Company added successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to add company.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row) => {
    setEditing({
      id: toCompanyId(row),
      company_id: row.company_id || '',
      company_name: row.company_name || '',
      required_cgpa: row.required_cgpa ?? '',
      minimum_pkg: row.minimum_pkg ?? '',
      max_pkg: row.max_pkg ?? '',
      year: row.year ?? '',
      domain: Array.isArray(row.domain) ? row.domain : [],
    });
    setEditSelectedDomain('');
  };

  const handleAddDomain = () => {
    if (!selectedDomain) return;
    if (selectedDomains.includes(selectedDomain)) {
      showToast('error', 'Domain already added.');
      return;
    }
    setSelectedDomains((prev) => [...prev, selectedDomain]);
    setSelectedDomain('');
  };

  const handleRemoveDomain = (domainToRemove) => {
    setSelectedDomains((prev) => prev.filter((domain) => domain !== domainToRemove));
  };

  const handleAddEditDomain = () => {
    if (!editSelectedDomain || !editing) return;
    if (editing.domain.includes(editSelectedDomain)) {
      showToast('error', 'Domain already added.');
      return;
    }
    setEditing((prev) => ({ ...prev, domain: [...prev.domain, editSelectedDomain] }));
    setEditSelectedDomain('');
  };

  const handleRemoveEditDomain = (domainToRemove) => {
    setEditing((prev) => ({
      ...prev,
      domain: prev.domain.filter((domain) => domain !== domainToRemove),
    }));
  };

  const handleUpdateCompany = async (event) => {
    event.preventDefault();
    if (!editing?.id) return;

    if (
      !editing.company_id ||
      !editing.company_name ||
      !editing.required_cgpa ||
      !editing.year ||
      !Array.isArray(editing.domain) ||
      editing.domain.length === 0
    ) {
      showToast('error', 'Please fill all required fields in edit form.');
      return;
    }

    const duplicateForYear = rows.some(
      (row) =>
        String(toCompanyId(row)) !== String(editing.id) &&
        Number(row.year) === Number(editing.year) &&
        normalizeCompanyName(row.company_name) === normalizeCompanyName(editing.company_name)
    );

    if (duplicateForYear) {
      showToast('error', 'This company is already added for the selected year.');
      return;
    }

    try {
      await companyService.updateCompany(editing.id, {
        company_id: String(editing.company_id).trim(),
        company_name: String(editing.company_name).trim(),
        required_cgpa: Number(editing.required_cgpa),
        minimum_pkg: Number(editing.minimum_pkg || 0),
        max_pkg: Number(editing.max_pkg || 0),
        year: Number(editing.year),
        domain: editing.domain,
      });
      setEditing(null);
      await refreshCompanies();
      showToast('success', 'Company updated successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to update company.');
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this company?')) return;

    try {
      await companyService.deleteCompany(id);
      await refreshCompanies();
      showToast('success', 'Company deleted successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to delete company.');
    }
  };

  const tableFilterOptions = useMemo(() => {
    const selectedCompany = String(tableFilters.companyName || '').trim().toLowerCase();
    const selectedYear = String(tableFilters.year || '').trim();
    const selectedDomain = String(tableFilters.domain || '').trim().toLowerCase();

    const companyFilteredRows = rows.filter((row) => {
      const rowYear = String(row.year || '').trim();
      const rowDomains = Array.isArray(row.domain) ? row.domain : [];

      if (selectedYear && rowYear !== selectedYear) return false;
      if (
        selectedDomain &&
        !rowDomains.some((domain) => String(domain || '').trim().toLowerCase() === selectedDomain)
      ) {
        return false;
      }
      return true;
    });

    const yearFilteredRows = rows.filter((row) => {
      const rowCompany = String(row.company_name || '').trim().toLowerCase();
      const rowDomains = Array.isArray(row.domain) ? row.domain : [];

      if (selectedCompany && rowCompany !== selectedCompany) return false;
      if (
        selectedDomain &&
        !rowDomains.some((domain) => String(domain || '').trim().toLowerCase() === selectedDomain)
      ) {
        return false;
      }
      return true;
    });

    const domainFilteredRows = rows.filter((row) => {
      const rowCompany = String(row.company_name || '').trim().toLowerCase();
      const rowYear = String(row.year || '').trim();

      if (selectedCompany && rowCompany !== selectedCompany) return false;
      if (selectedYear && rowYear !== selectedYear) return false;
      return true;
    });

    const companyNames = [
      ...new Set(companyFilteredRows.map((row) => String(row.company_name || '').trim()).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    const years = [...new Set(yearFilteredRows.map((row) => String(row.year || '').trim()).filter(Boolean))].sort(
      (a, b) => Number(b) - Number(a)
    );

    const domains = [
      ...new Set(
        domainFilteredRows
          .flatMap((row) => (Array.isArray(row.domain) ? row.domain : []))
          .map((domain) => String(domain || '').trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));

    return { companyNames, years, domains };
  }, [rows, tableFilters.companyName, tableFilters.year, tableFilters.domain]);

  useEffect(() => {
    if (tableFilters.companyName && !tableFilterOptions.companyNames.includes(tableFilters.companyName)) {
      setTableFilters((prev) => ({ ...prev, companyName: '' }));
    }

    if (tableFilters.year && !tableFilterOptions.years.includes(tableFilters.year)) {
      setTableFilters((prev) => ({ ...prev, year: '' }));
    }

    if (tableFilters.domain && !tableFilterOptions.domains.includes(tableFilters.domain)) {
      setTableFilters((prev) => ({ ...prev, domain: '' }));
    }
  }, [
    tableFilters.companyName,
    tableFilters.year,
    tableFilters.domain,
    tableFilterOptions.companyNames,
    tableFilterOptions.years,
    tableFilterOptions.domains,
  ]);

  const handleTableFilterChange = (field, value) => {
    setTableFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const resetTableFilters = () => {
    setTableFilters({
      companyName: '',
      year: '',
      domain: '',
    });
    setCurrentPage(1);
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const companyName = String(row.company_name || '').trim();
      const year = String(row.year || '').trim();
      const domainList = Array.isArray(row.domain) ? row.domain : [];

      if (tableFilters.companyName && companyName.toLowerCase() !== tableFilters.companyName.toLowerCase()) {
        return false;
      }

      if (tableFilters.year && year !== tableFilters.year) {
        return false;
      }

      if (tableFilters.domain && !domainList.some((domain) => String(domain || '').trim().toLowerCase() === tableFilters.domain.toLowerCase())) {
        return false;
      }

      if (!query) return true;
      return companyName.toLowerCase().includes(query);
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

  const availableDomains = useMemo(
    () => domains.filter((domain) => !selectedDomains.includes(domain)),
    [domains, selectedDomains]
  );

  const availableEditDomains = useMemo(() => {
    const currentEditDomains = Array.isArray(editing?.domain) ? editing.domain : [];
    return domains.filter((domain) => !currentEditDomains.includes(domain));
  }, [domains, editing]);

  const companyNameOptions = useMemo(() => {
    const names = rows.map((row) => String(row.company_name || '').trim()).filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const columns = useMemo(
    () => [
      { key: 'company_id', header: 'Company ID', width: '10%' },
      { key: 'company_name', header: 'Name', width: '20%' },
      {
        key: 'required_cgpa',
        header: 'CGPA',
        width: '10%',
        render: (row) => (Number.isFinite(Number(row.required_cgpa)) ? Number(row.required_cgpa).toFixed(2) : '-'),
      },
      { key: 'year', header: 'Year', width: '8%' },
      {
        key: 'domain',
        header: 'Domain',
        width: '22%',
        render: (row) => (
          <div className="flex flex-wrap gap-1 pr-2">
            {Array.isArray(row.domain) && row.domain.length > 0 ?
              row.domain.map((d, idx) => (
                <span key={idx} className="inline-block whitespace-nowrap rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {d}
                </span>
              )) : '-'
            }
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        width: '15%',
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => startEdit(row)}
              aria-label="Edit"
              title="Edit"
              className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteCompany(toCompanyId(row))}
              aria-label="Delete"
              title="Delete"
              className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
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
          <p className="mt-2 text-sm text-gray-600">Only Main TPO can manage company data.</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Manage Company Data</h2>
          <p className="mt-1 text-sm text-gray-600">Add and manage company placement requirements</p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900">Manual Entry</h3>
            <form onSubmit={handleAddCompany} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="text-sm font-medium text-gray-700">Company ID</label>
                <input
                  value={companyId}
                  readOnly
                  className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                  placeholder="Auto-generated"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-sm font-medium text-gray-700">Company Name</label>
                <input
                  list="company-name-options"
                  value={form.company_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, company_name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Tech Mahindra"
                />
                <datalist id="company-name-options">
                  {companyNameOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Required CGPA</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.required_cgpa}
                  onChange={(event) => setForm((prev) => ({ ...prev, required_cgpa: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="6.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="2026"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Domain</label>
                <div className="mt-1 flex gap-2">
                  <select
                    value={selectedDomain}
                    onChange={(event) => setSelectedDomain(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select Domain</option>
                    {availableDomains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddDomain}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedDomains.map((domain) => (
                    <span
                      key={domain}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                    >
                      {domain}
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        className="rounded-full p-0.5 text-blue-700 hover:bg-blue-200"
                        aria-label={`Remove ${domain}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Adding...' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">All Companies</h3>
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by company name"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={tableFilters.companyName}
              onChange={(event) => handleTableFilterChange('companyName', event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">All Company Names</option>
              {tableFilterOptions.companyNames.map((companyName) => (
                <option key={companyName} value={companyName}>
                  {companyName}
                </option>
              ))}
            </select>

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
              <Table columns={columns} rows={paginatedRows} emptyLabel="No companies found." />

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
                  <h3 className="text-2xl font-bold text-gray-900">Edit Company</h3>
                  <p className="text-sm text-gray-500 mt-1">Update company details and requirements</p>
                </div>
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 transition flex-shrink-0">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateCompany} className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company ID</label>
                    <input
                      value={editing.company_id}
                      readOnly
                      className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      list="company-name-options"
                      value={editing.company_name}
                      readOnly
                      className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Requirements */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Academic Requirements</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required CGPA</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editing.required_cgpa}
                      onChange={(event) => setEditing((prev) => ({ ...prev, required_cgpa: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <input
                      type="number"
                      value={editing.year}
                      readOnly
                      className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Domain Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Domains</h4>
                <div className="flex gap-2">
                  <select
                    value={editSelectedDomain}
                    onChange={(event) => setEditSelectedDomain(event.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                  >
                    <option value="">Select Domain</option>
                    {availableEditDomains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddEditDomain}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition shadow-sm"
                  >
                    Add Domain
                  </button>
                </div>
                {editing.domain.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                    {editing.domain.map((domain) => (
                      <span
                        key={domain}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800 shadow-sm"
                      >
                        {domain}
                        <button
                          type="button"
                          onClick={() => handleRemoveEditDomain(domain)}
                          className="rounded-full p-0.5 text-blue-600 hover:bg-blue-200 transition"
                          aria-label={`Remove ${domain}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="mt-8 flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
                >
                  Save Changes
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
