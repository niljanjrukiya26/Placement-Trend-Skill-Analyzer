import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Save,
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

function normalizeStudentsResponse(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.students)) return payload.students;
  if (Array.isArray(payload)) return payload;
  return [];
}

function getStudentErrorMessage(error, fallbackMessage) {
  const apiMessage = String(error?.response?.data?.message || '').toLowerCase();

  if (
    apiMessage.includes('student_id already exists') ||
    apiMessage.includes('already exists in students/users collection')
  ) {
    return 'Student ID already exists.';
  }

  if (
    apiMessage.includes('student_id is required') ||
    apiMessage.includes('cgpa is required') ||
    apiMessage.includes('backlogs is required') ||
    apiMessage.includes('date_of_birth is required')
  ) {
    return 'Please fill all required fields.';
  }

  if (apiMessage.includes('date_of_birth must be in yyyy-mm-dd format')) {
    return 'Date of birth must be in YYYY-MM-DD format.';
  }

  if (apiMessage.includes('backlogs must be >= 0')) {
    return 'Backlogs must be 0 or more.';
  }

  return error?.response?.data?.message || fallbackMessage;
}

export default function ManageStudents() {
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
  const [editingStudentId, setEditingStudentId] = useState('');
  const [editForm, setEditForm] = useState({ cgpa: '', backlogs: '', date_of_birth: '' });
  const [form, setForm] = useState({
    student_id: '',
    cgpa: '',
    backlogs: '',
    date_of_birth: '',
  });

  const displayName = useMemo(() => user.email?.split('@')[0] || 'TPO User', [user.email]);
  const roleLabel = isMain ? 'Main TPO' : 'Branch TPO';
  const branchLabel = user.branch || 'Branch';

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(showToast.timerId);
    showToast.timerId = window.setTimeout(() => setToast(null), 3000);
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await tpoService.getBranchStudents();
      setRows(normalizeStudentsResponse(response?.data));
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isBranch) {
      fetchStudents();
    }
  }, [isBranch]);

  const handleLogout = () => {
    authUtils.clearAuthData();
    navigate('/login');
  };

  const validateForm = (payload) => {
    if (
      !String(payload.student_id || '').trim() ||
      !String(payload.cgpa || '').trim() ||
      !String(payload.backlogs || '').trim() ||
      !String(payload.date_of_birth || '').trim()
    ) {
      showToast('error', 'Please fill all required fields.');
      return false;
    }

    if (!Number.isFinite(Number(payload.cgpa))) {
      showToast('error', 'CGPA must be a valid number.');
      return false;
    }

    if (!Number.isFinite(Number(payload.backlogs)) || Number(payload.backlogs) < 0) {
      showToast('error', 'Backlogs must be 0 or more.');
      return false;
    }

    return true;
  };

  const handleAddStudent = async (event) => {
    event.preventDefault();
    if (!validateForm(form)) return;

    try {
      setSaving(true);
      const response = await tpoService.addStudent({
        student_id: form.student_id.trim().toUpperCase(),
        cgpa: Number(form.cgpa),
        backlogs: Number(form.backlogs),
        date_of_birth: form.date_of_birth,
      });

      const created = response?.data?.data || {};
      const normalizedStudentId = form.student_id.trim().toUpperCase();
      const message = `Student account created successfully (${created.student_id || normalizedStudentId} + ${created.email || `${normalizedStudentId.toLowerCase()}@bvmengineering.ac.in`})`;

      setForm({ student_id: '', cgpa: '', backlogs: '', date_of_birth: '' });
      await fetchStudents();
      showToast('success', message);
    } catch (error) {
      showToast('error', getStudentErrorMessage(error, 'Failed to create student account.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!studentId) return;
    if (!window.confirm('Are you sure you want to delete this student account?')) return;

    try {
      await tpoService.deleteStudent(studentId);
      await fetchStudents();
      showToast('success', 'Student and login account deleted successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to delete student.');
    }
  };

  const handleStartEdit = (row) => {
    setEditingStudentId(row.student_id);
    setEditForm({
      cgpa: row?.cgpa ?? '',
      backlogs: row?.backlogs ?? '',
      date_of_birth: row?.date_of_birth || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingStudentId('');
    setEditForm({ cgpa: '', backlogs: '', date_of_birth: '' });
  };

  const handleSaveEdit = async (studentId) => {
    if (!String(editForm.cgpa || '').trim() || !String(editForm.backlogs || '').trim() || !String(editForm.date_of_birth || '').trim()) {
      showToast('error', 'Please fill all required fields.');
      return;
    }

    const cgpaValue = Number(editForm.cgpa);
    const backlogsValue = Number(editForm.backlogs);

    if (!Number.isFinite(cgpaValue)) {
      showToast('error', 'CGPA must be a valid number.');
      return;
    }
    if (!Number.isFinite(backlogsValue) || backlogsValue < 0) {
      showToast('error', 'Backlogs must be 0 or more.');
      return;
    }

    try {
      setSaving(true);
      await tpoService.updateStudent(studentId, {
        cgpa: cgpaValue,
        backlogs: backlogsValue,
        date_of_birth: editForm.date_of_birth,
      });
      await fetchStudents();
      handleCancelEdit();
      showToast('success', 'Student academic details updated successfully.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to update student.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (studentId) => {
    if (!studentId) return;
    if (!window.confirm(`Reset password for ${studentId} to Student123?`)) return;

    try {
      setSaving(true);
      await tpoService.resetStudentPassword(studentId);
      showToast('success', `Password reset for ${studentId}. New password: Student123`);
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSaving(false);
    }
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => String(row.student_id || '').toLowerCase().includes(query));
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
      { key: 'student_id', header: 'Student ID', width: '20%' },
      { key: 'branch', header: 'Branch', width: '28%' },
      {
        key: 'cgpa',
        header: 'CGPA',
        width: '14%',
        render: (row) => {
          const isEditing = editingStudentId === row.student_id;
          if (!isEditing) {
            return Number.isFinite(Number(row.cgpa)) ? Number(row.cgpa).toFixed(2) : '-';
          }

          return (
            <input
              type="number"
              step="0.01"
              value={editForm.cgpa}
              onChange={(event) => setEditForm((prev) => ({ ...prev, cgpa: event.target.value }))}
              className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            />
          );
        },
      },
      {
        key: 'backlogs',
        header: 'Backlogs',
        width: '12%',
        render: (row) => {
          const isEditing = editingStudentId === row.student_id;
          if (!isEditing) {
            return row.backlogs;
          }

          return (
            <input
              type="number"
              value={editForm.backlogs}
              onChange={(event) => setEditForm((prev) => ({ ...prev, backlogs: event.target.value }))}
              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            />
          );
        },
      },
      {
        key: 'date_of_birth',
        header: 'DOB',
        width: '18%',
        render: (row) => {
          const isEditing = editingStudentId === row.student_id;
          if (!isEditing) {
            return row.date_of_birth || '-';
          }

          return (
            <input
              type="date"
              value={editForm.date_of_birth}
              onChange={(event) => setEditForm((prev) => ({ ...prev, date_of_birth: event.target.value }))}
              className="w-36 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            />
          );
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        width: '24%',
        render: (row) => (
          <div className="flex flex-wrap justify-center gap-1.5">
            {editingStudentId === row.student_id ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveEdit(row.student_id)}
                  disabled={saving}
                  aria-label="Save"
                  title="Save"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-60"
                >
                  <Save className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  aria-label="Cancel"
                  title="Cancel"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleStartEdit(row)}
                  aria-label="Edit"
                  title="Edit"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleResetPassword(row.student_id)}
                  disabled={saving}
                  aria-label="Reset Password"
                  title="Reset Password"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-60"
                >
                  <KeyRound className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStudent(row.student_id)}
                  disabled={saving}
                  aria-label="Delete"
                  title="Delete"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [editingStudentId, editForm, saving]
  );

  if (!isBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="mx-auto mt-24 max-w-xl rounded-xl border border-rose-200 bg-white p-8 text-center shadow-md">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-rose-500" />
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-600">Only Branch TPO can manage students.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {toast && (
        <div className="fixed right-4 top-4 z-[100]">
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

      <main className="px-4 py-6 lg:ml-72 lg:px-8 lg:py-8">
        <header className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Manage Students</h2>
          <p className="mt-1 text-sm text-gray-600">Create student records and login accounts in one step.</p>
        </header>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">Add Student</h3>
          <form onSubmit={handleAddStudent} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Student ID</label>
              <input
                value={form.student_id}
                onChange={(event) => setForm((prev) => ({ ...prev, student_id: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="22IT101"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Branch (Auto)</label>
              <input
                value={branchLabel}
                readOnly
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
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
                placeholder="8.10"
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
              <label className="text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(event) => setForm((prev) => ({ ...prev, date_of_birth: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create Student Account
              </button>
            </div>
          </form>
        </section>


        <section className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Students List</h3>
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Search by student ID"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="grid grid-cols-1 gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : (
              <Table columns={columns} rows={paginatedRows} emptyLabel="No students found." />
            )}
          </div>

          {!loading && filteredRows.length > 0 && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRows.length)} of {filteredRows.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50"
                >
                  Prev
                </button>
                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      page === currentPage ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
