import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  Building2,
  FileUp,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldAlert,
  Trophy,
  UserCog,
  X,
} from 'lucide-react';
import { authUtils } from '../../utils/auth';
import { getCurrentUser, normalizeRole, ROLES } from '../../utils/tpo/roles';
import { tpoService } from '../../services/api';
import Sidebar from '../../components/Sidebar';

function getInitials(nameOrEmail) {
  if (!nameOrEmail || typeof nameOrEmail !== 'string') return 'TP';
  const tokens = nameOrEmail.trim().split(/\s+/);
  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

const medalStyles = {
  1: 'bg-amber-100 text-amber-700',
  2: 'bg-slate-200 text-slate-700',
  3: 'bg-orange-100 text-orange-700',
};

export default function Leaderboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const normalizedRole = normalizeRole(user.role);
  const isMain = normalizedRole === ROLES.MAIN_TPO;
  const isBranch = normalizedRole === ROLES.BRANCH_TPO;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [limit, setLimit] = useState(20);

  const displayName = useMemo(() => user.email?.split('@')[0] || 'TPO User', [user.email]);
  const roleLabel = isMain ? 'Main TPO' : 'Branch TPO';

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(showToast.timerId);
    showToast.timerId = window.setTimeout(() => setToast(null), 2800);
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await tpoService.getLeaderboard({
        q: search.trim(),
        limit,
        ...(isMain && branchFilter.trim() ? { branch: branchFilter.trim() } : {}),
      });
      setRows(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleLogout = () => {
    authUtils.clearAuthData();
    navigate('/login');
  };

  const topThree = rows.slice(0, 3);

  if (!isMain && !isBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="mx-auto mt-24 max-w-xl rounded-xl border border-rose-200 bg-white p-8 text-center shadow-md">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-rose-500" />
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-600">Only TPO users can access leaderboard.</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Prediction Leaderboard</h2>
          <p className="mt-1 text-sm text-gray-600">Live ranking based on overall prediction scores.</p>
        </header>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Search by student ID"
              />
            </div>

            {isMain && (
              <input
                value={branchFilter}
                onChange={(event) => setBranchFilter(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Branch filter (e.g. IT)"
              />
            )}

            <select
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>

            <button
              type="button"
              onClick={fetchLeaderboard}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {topThree.map((item) => (
            <div key={item.student_id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${medalStyles[item.rank] || 'bg-blue-100 text-blue-700'}`}>
                  Rank #{item.rank}
                </span>
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">{item.student_id}</p>
              <p className="text-xs text-gray-500">{item.branch || 'N/A'}</p>
              <p className="mt-3 text-sm text-gray-600">Prediction Score</p>
              <p className="text-2xl font-extrabold text-indigo-700">{Number(item.score || 0).toFixed(2)}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Leaderboard Table</h3>

          {loading ? (
            <div className="grid grid-cols-1 gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No leaderboard entries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-3">Rank</th>
                    <th className="px-3 py-3">Student ID</th>
                    <th className="px-3 py-3">Branch</th>
                    <th className="px-3 py-3">CGPA</th>
                    <th className="px-3 py-3">Score</th>
                    <th className="px-3 py-3">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.student_id}-${row.rank}`} className={`border-b border-gray-100 ${row.rank <= 3 ? 'bg-amber-50/40' : 'bg-white'}`}>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${medalStyles[row.rank] || 'bg-blue-100 text-blue-700'}`}>
                          #{row.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-900">{row.student_id}</td>
                      <td className="px-3 py-3 text-gray-700">{row.branch || '-'}</td>
                      <td className="px-3 py-3 text-gray-700">{Number.isFinite(Number(row.cgpa)) ? Number(row.cgpa).toFixed(2) : '-'}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {Number(row.score || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{row.last_updated ? new Date(row.last_updated).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}