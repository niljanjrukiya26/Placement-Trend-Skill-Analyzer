import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Percent,
  Trophy,
  UserCheck2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getCurrentUser, ROLES, normalizeRole } from '../../utils/tpo/roles';
import { tpoService } from '../../services/api';
import { authUtils } from '../../utils/auth';
import Sidebar from '../../components/Sidebar';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  BarElement
);

function DashboardCard({ label, value, icon: Icon, tone = 'blue' }) {
  const toneStyles = {
    blue: 'from-blue-100 to-blue-200 text-blue-600',
    green: 'from-green-100 to-green-200 text-green-600',
    purple: 'from-purple-100 to-purple-200 text-purple-600',
    amber: 'from-amber-100 to-amber-200 text-amber-600',
  };

  return (
    <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between">
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <div className={`rounded-lg bg-gradient-to-br p-3 ${toneStyles[tone] || toneStyles.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-4xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function EmptyBlock({ title }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
      {title}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalPlaced: 0,
    totalCompanies: 0,
    placementPercent: 0,
  });
  const [tpoProfile, setTpoProfile] = useState(null);
  const [yearStats, setYearStats] = useState([]);
  const [branchStats, setBranchStats] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');

  const branchBarCanvasRef = useRef(null);
  const branchBarChartRef = useRef(null);

  const user = getCurrentUser();
  const displayEmail = user.email || authUtils.getUserEmail();

  const normalizedRole = normalizeRole(tpoProfile?.role || user.role);
  const isMain = normalizedRole === ROLES.MAIN_TPO;
  const isBranch = normalizedRole === ROLES.BRANCH_TPO;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        if (!displayEmail) {
          setError('Unable to identify logged in user email. Please login again.');
          setLoading(false);
          return;
        }

        const [profileRes, summaryRes] = await Promise.all([
          tpoService.getProfile(displayEmail),
          tpoService.getDashboard(displayEmail),
        ]);

        const profileData = profileRes?.data?.data || null;
        setTpoProfile(profileData);
        setSummary(summaryRes?.data?.data || {});

        const roleFromApi = normalizeRole(profileData?.role || user.role);
        const yearRes = await tpoService.getYearStats(displayEmail);
        const yearly = yearRes?.data?.data || [];
        setYearStats(yearly);

        if (roleFromApi === ROLES.MAIN_TPO && yearly.length > 0) {
          const years = yearly.map((item) => Number(item.year)).filter((value) => Number.isFinite(value));
          const latestYear = years.length ? Math.max(...years) : yearly[yearly.length - 1]?.year;
          setSelectedYear(String(latestYear));
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [displayEmail, user.role]);

  useEffect(() => {
    const loadBranchStats = async () => {
      if (!isMain || !displayEmail || !selectedYear) return;

      try {
        const branchRes = await tpoService.getBranchStats(displayEmail, Number(selectedYear));
        setBranchStats(branchRes?.data?.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load branch-wise stats');
      }
    };

    loadBranchStats();
  }, [isMain, displayEmail, selectedYear]);

  const yearLineData = useMemo(
    () => ({
      labels: yearStats.map((row) => row.year),
      datasets: [
        {
          label: 'Placed Students',
          data: yearStats.map((row) => row.placed),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.2)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
        },
      ],
    }),
    [yearStats]
  );

  const yearLineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
      },
      scales: {
        x: { title: { display: true, text: 'placement_year' } },
        y: { title: { display: true, text: 'placed students' }, beginAtZero: true },
      },
    }),
    []
  );

  useEffect(() => {
    console.log(yearStats);
  }, [yearStats]);

  useEffect(() => {
    if (!isMain || !branchBarCanvasRef.current || !branchStats.length) return;

    if (branchBarChartRef.current) {
      branchBarChartRef.current.destroy();
    }

    branchBarChartRef.current = new ChartJS(branchBarCanvasRef.current, {
      type: 'bar',
      data: {
        labels: branchStats.map((row) => row.branch),
        datasets: [
          {
            label: 'Placed Students',
            data: branchStats.map((row) => row.placed),
            backgroundColor: '#10b981',
            borderRadius: 6,
          },
          {
            label: 'Total Students',
            data: branchStats.map((row) => row.total),
            backgroundColor: '#6366f1',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
        },
        scales: {
          x: { title: { display: true, text: 'branch' } },
          y: { title: { display: true, text: 'students' }, beginAtZero: true },
        },
      },
    });

    return () => {
      if (branchBarChartRef.current) {
        branchBarChartRef.current.destroy();
      }
    };
  }, [isMain, branchStats]);

  const handleLogout = () => {
    authUtils.clearAuthData();
    navigate('/login');
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail || typeof nameOrEmail !== 'string') return 'TP';
    const tokens = nameOrEmail.trim().split(/\s+/);
    if (tokens.length >= 2) {
      return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
    }
    return nameOrEmail.slice(0, 2).toUpperCase();
  };

  const displayName = tpoProfile?.name || user.email?.split('@')?.[0] || 'TPO User';
  const roleLabel = normalizedRole === ROLES.MAIN_TPO ? 'Main TPO' : 'Branch TPO';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />

      <main className="px-4 py-6 lg:ml-72 lg:px-8 lg:py-8">
        <header className="mb-6 rounded-xl bg-white p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Placement Management System</h2>
              <p className="mt-1 text-sm text-gray-600">Institution-wide placement overview</p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-xl bg-white shadow-md" />
            ))}
          </div>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardCard label="Total Students" value={summary.totalStudents || 0} icon={Users} tone="blue" />
              <DashboardCard label="Total Placed" value={summary.totalPlaced || 0} icon={UserCheck2} tone="green" />
              <DashboardCard label="Total Companies" value={summary.totalCompanies || 0} icon={Building2} tone="purple" />
              <DashboardCard label="Placement %" value={`${summary.placementPercent || 0}%`} icon={Percent} tone="amber" />
            </section>

            <div className="space-y-6">
              <section className="rounded-xl bg-white p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isMain
                    ? 'Placement Trends (All Branches)'
                    : `Placement Trends (${tpoProfile?.branch || user.branch || 'Branch'})`}
                </h3>

                <div className="mt-5 h-80">
                  {yearStats.length ? (
                    <Line data={yearLineData} options={yearLineOptions} />
                  ) : (
                    <EmptyBlock title="No year-wise placement data available." />
                  )}
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Year</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total Students</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Placed</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Placement %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {yearStats.map((row) => (
                        <tr key={row.year} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-700">{row.year}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{row.total}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{row.placed}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{row.percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {isMain && (
                <section className="rounded-xl bg-white p-6 shadow-md">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">Branch-wise Placement</h3>
                    <select
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(event.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                    >
                      {yearStats.map((row) => (
                        <option key={row.year} value={row.year}>
                          {row.year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="h-80">
                    {branchStats.length ? (
                      <canvas ref={branchBarCanvasRef} />
                    ) : (
                      <EmptyBlock title="No branch-wise data available for selected year." />
                    )}
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Branch</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total Students</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Placed</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Placement %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {branchStats.map((row) => (
                          <tr key={`${selectedYear}-${row.branch}`} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-700">{row.branch}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{row.total}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{row.placed}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{row.percent}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
