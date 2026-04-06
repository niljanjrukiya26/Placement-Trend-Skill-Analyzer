import React, { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  Briefcase,
  Users,
  ClipboardList,
  Activity,
  Brain,
  UserCog,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { authUtils } from '../../utils/auth';
import { canAccessPage, PAGE_KEYS, ROLES, getCurrentUser } from '../../utils/tpo/roles';

const navItems = [
  { key: PAGE_KEYS.DASHBOARD, label: 'Dashboard', to: '/tpo/dashboard', icon: BarChart3 },
  { key: PAGE_KEYS.MANAGE_TPO, label: 'Manage TPO', to: '/tpo/manage-tpo', icon: UserCog },
  { key: PAGE_KEYS.COMPANIES, label: 'Companies', to: '/tpo/companies', icon: Building2 },
  { key: PAGE_KEYS.JOB_ROLES, label: 'Job Roles', to: '/tpo/job-roles', icon: Briefcase },
  { key: PAGE_KEYS.STUDENTS, label: 'Students', to: '/tpo/students', icon: Users },
  { key: PAGE_KEYS.PLACEMENT_RECORDS, label: 'Placement Records', to: '/tpo/placement-records', icon: ClipboardList },
  { key: PAGE_KEYS.ANALYTICS, label: 'Analytics', to: '/tpo/analytics', icon: Activity },
  { key: PAGE_KEYS.SKILL_GAP, label: 'Skill Gap Analysis', to: '/tpo/skill-gap', icon: Brain },
];

export default function TPOLayout() {
  const [open, setOpen] = useState(false);
  const user = getCurrentUser();
  const navigate = useNavigate();

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => canAccessPage(user.role, item.key)),
    [user.role]
  );

  const roleLabel = user.role === ROLES.MAIN_TPO ? 'Main TPO' : 'Branch TPO';

  const handleLogout = () => {
    authUtils.clearAuthData();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-emerald-50">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-slate-900 p-2 text-white shadow-lg lg:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-white/95 p-5 backdrop-blur transition lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link to="/tpo/dashboard" className="mb-6 block border-b border-slate-200 pb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Placement Management</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">TPO Console</h1>
        </Link>

        <nav className="space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Signed in as</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">{user.email}</p>
          <p className="text-xs text-slate-500">{roleLabel} | {user.branch}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Placement Management System</h2>
              <p className="text-sm text-slate-500">Role based control panel for Main and Branch TPO teams</p>
            </div>
            <div className="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700">
              {roleLabel}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
