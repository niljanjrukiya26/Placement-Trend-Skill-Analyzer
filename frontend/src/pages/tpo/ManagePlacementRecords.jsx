import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Edit2,
  FileDown,
  FileUp,
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
  const [csvFile, setCsvFile] = useState(null);
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
    fetchRecords();
  }, []);

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

    if (form.placed_status === 'true' && (!form.company_name.trim() || !String(form.package_lpa || '').trim())) {
      showToast('error', 'Company and package are required for placed students.');
      return false;
    }

    return true;
  };

  const handleAddRecord = async (event) => {
    event.preventDefault();
    if (!validateManualForm()) return;

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

  const handleDownloadTemplate = async () => {
    try {
      const response = await tpoService.downloadPlacementTemplate();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'placement_records_template.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to download template.');
    }
  };

  const handleUploadCsv = async () => {
    if (!csvFile) {
      showToast('error', 'Please choose a CSV file first.');
      return;
    }

    try {
      setSaving(true);
      await tpoService.uploadPlacementRecordsCsv(csvFile);
      setCsvFile(null);
      await fetchRecords();
      showToast('success', 'CSV uploaded successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to upload CSV.');
    } finally {
      setSaving(false);
    }
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

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = !query
      ? [...rows]
      : rows.filter((row) =>
          String(row.student_id || '').toLowerCase().includes(query) ||
          String(row.company_name || '').toLowerCase().includes(query) ||
          String(row.job_role || '').toLowerCase().includes(query)
        );

    return filtered.sort((a, b) => Number(b.placement_year || 0) - Number(a.placement_year || 0));
  }, [rows, search]);

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
  }, [search]);

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
        <div className="fixed right-4 top-4 z-[100]">
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
              <input
                type="number"
                value={form.placement_year}
                onChange={(event) => setForm((prev) => ({ ...prev, placement_year: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="2026"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.placed_status}
                onChange={(event) => setForm((prev) => ({ ...prev, placed_status: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="true">Placed</option>
                <option value="false">Not Placed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Company Name</label>
              <input
                value={form.company_name}
                onChange={(event) => setForm((prev) => ({ ...prev, company_name: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Tech Mahindra"
              />
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
              <input
                value={form.domain}
                onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Software Development"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Job Role</label>
              <input
                value={form.job_role}
                onChange={(event) => setForm((prev) => ({ ...prev, job_role: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Software Engineer"
              />
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

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">CSV Upload</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[auto_1fr_auto] md:items-center">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FileDown className="h-4 w-4" />
              Download Template
            </button>

            <input
              type="file"
              accept=".csv"
              onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={handleUploadCsv}
              disabled={saving || !csvFile || !isBranch}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileUp className="h-4 w-4" />
              Upload
            </button>
          </div>
          {!isBranch && (
            <p className="mt-2 text-xs text-amber-600">CSV upload is available only for Branch TPO accounts.</p>
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
                    onChange={(event) => setEditing((prev) => ({ ...prev, student_id: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  <input
                    type="number"
                    value={editing.placement_year}
                    onChange={(event) => setEditing((prev) => ({ ...prev, placement_year: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editing.placed_status}
                    onChange={(event) => setEditing((prev) => ({ ...prev, placed_status: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="true">Placed</option>
                    <option value="false">Not Placed</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Company</label>
                  <input
                    value={editing.company_name}
                    onChange={(event) => setEditing((prev) => ({ ...prev, company_name: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
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
                  <input
                    value={editing.domain}
                    onChange={(event) => setEditing((prev) => ({ ...prev, domain: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Job Role</label>
                  <input
                    value={editing.job_role}
                    onChange={(event) => setEditing((prev) => ({ ...prev, job_role: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
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
