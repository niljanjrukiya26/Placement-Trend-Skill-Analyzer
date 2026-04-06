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
  PlusCircle,
  ShieldAlert,
  Trash2,
  Trophy,
  UserCog,
  X,
} from 'lucide-react';
import { getCurrentUser, ROLES, normalizeRole } from '../../utils/tpo/roles';
import { tpoService } from '../../services/api';
import { authUtils } from '../../utils/auth';
import Sidebar from '../../components/Sidebar';

function getInitials(nameOrEmail) {
  if (!nameOrEmail || typeof nameOrEmail !== 'string') return 'TP';
  const tokens = nameOrEmail.trim().split(/\s+/);
  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

export default function ManageTPO() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isMain = normalizeRole(user.role) === ROLES.MAIN_TPO;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    branch: '',
    role: 'MAIN_TPO',
  });

  const [editing, setEditing] = useState(null);

  const displayName = user.email?.split('@')[0] || 'TPO User';
  const roleLabel = isMain ? 'Main TPO' : 'Branch TPO';

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedRows;

    return sortedRows.filter((tpo) =>
      (tpo.name || '').toLowerCase().includes(query) ||
      (tpo.email || '').toLowerCase().includes(query) ||
      (tpo.branch || '').toLowerCase().includes(query)
    );
  }, [sortedRows, search]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await tpoService.getAllTPOs();
      setRows(res?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch TPO records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMain) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [isMain]);

  const handleLogout = () => {
    authUtils.clearAuthData();
    navigate('/login');
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const requiresBranch = form.role === 'BRANCH_TPO';
    if (!form.name || !form.email || !form.password || !form.role || (requiresBranch && !form.branch)) {
      setError('Please fill all required fields.');
      return;
    }

    try {
      setSaving(true);
      await tpoService.addTPO({
        tpo_name: form.name,
        email: form.email,
        password: form.password,
        branch: requiresBranch ? form.branch : '',
        role: form.role,
      });
      setMessage('TPO added successfully.');
      setForm({ name: '', email: '', password: '', branch: '', role: 'MAIN_TPO' });
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add TPO');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editing?.userid) return;

    const requiresBranch = editing.role === 'BRANCH_TPO';
    if (!editing.name || (requiresBranch && !editing.branch)) {
      setError('Please fill all required fields.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      await tpoService.updateTPO(editing.userid, {
        tpo_name: editing.name,
        branch: requiresBranch ? editing.branch : '',
        role: editing.role,
      });
      setMessage('TPO updated successfully.');
      setEditing(null);
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update TPO');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userid) => {
    const confirmed = window.confirm('Are you sure you want to delete this TPO?');
    if (!confirmed) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');
      await tpoService.deleteTPO(userid);
      setMessage('TPO deleted successfully.');
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete TPO');
    } finally {
      setSaving(false);
    }
  };

  if (!isMain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="mx-auto mt-24 max-w-xl rounded-xl border border-rose-200 bg-white p-8 text-center shadow-md">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-rose-500" />
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-600">Only Main TPO can manage TPO accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />

      <main className="px-4 py-6 lg:ml-72 lg:px-8 lg:py-8">
        <header className="mb-6 rounded-xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Manage TPO</h2>
          <p className="mt-1 text-sm text-gray-600">Create and maintain TPO accounts with role-based access.</p>
        </header>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <section className="mb-6 rounded-xl bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Add New TPO</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Name"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Password"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <select
                value={form.role}
                onChange={(event) => {
                  const nextRole = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    role: nextRole,
                    branch: nextRole === 'MAIN_TPO' ? '' : prev.branch,
                  }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="MAIN_TPO">Main TPO</option>
                <option value="BRANCH_TPO">Branch TPO</option>
              </select>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
              >
                <PlusCircle className="h-4 w-4" />
                Add
              </button>
            </div>

            {form.role === 'BRANCH_TPO' && (
              <input
                value={form.branch}
                onChange={(event) => setForm((prev) => ({ ...prev, branch: event.target.value }))}
                placeholder="Branch"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
              />
            )}
          </form>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-md">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900">All TPOs</h3>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search TPO..."
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {loading ? (
            <div className="h-36 animate-pulse rounded-xl bg-slate-100" />
          ) : filteredRows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRows.map((row) => (
                    <tr key={row.userid} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700">{row.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.email || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.branch || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.role || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditing({
                                userid: row.userid,
                                name: row.name || '',
                                branch: row.branch || '',
                                role: row.role || 'BRANCH_TPO',
                              })
                            }
                            aria-label="Edit"
                            title="Edit"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.userid)}
                            aria-label="Delete"
                            title="Delete"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No matching TPO records found.
            </div>
          )}
        </section>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Edit TPO</h3>
            <form onSubmit={handleUpdate} className="space-y-3">
              <input
                value={editing.name}
                onChange={(event) => setEditing((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <select
                value={editing.role}
                onChange={(event) => {
                  const nextRole = event.target.value;
                  setEditing((prev) => ({
                    ...prev,
                    role: nextRole,
                    branch: nextRole === 'MAIN_TPO' ? '' : prev.branch,
                  }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="MAIN_TPO">Main TPO</option>
                <option value="BRANCH_TPO">Branch TPO</option>
              </select>

              {editing.role === 'BRANCH_TPO' && (
                <input
                  value={editing.branch}
                  onChange={(event) => setEditing((prev) => ({ ...prev, branch: event.target.value }))}
                  placeholder="Branch"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
