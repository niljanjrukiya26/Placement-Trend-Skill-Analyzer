import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import Sidebar from '../../components/Sidebar';
import Table from '../../components/tpo/Table';
import { placementService } from '../../services/api';
import { authUtils } from '../../utils/auth';
import { normalizeRole, ROLES } from '../../utils/tpo/roles';

const FALLBACK_USER = {
  role: 'branch_tpo',
  branch: 'Civil Engineering',
};

function resolveUserContext() {
  const normalizedRole = normalizeRole(authUtils.getUserRole());
  const savedBranch = authUtils.getUserBranch() || FALLBACK_USER.branch;

  if (normalizedRole === ROLES.MAIN_TPO) {
    return { role: 'main_tpo', branch: '' };
  }

  if (normalizedRole === ROLES.BRANCH_TPO) {
    return { role: 'branch_tpo', branch: savedBranch };
  }

  return FALLBACK_USER;
}

export default function PlacementDashboard() {
  const user = useMemo(() => resolveUserContext(), []);
  const isMainTpo = user.role === 'main_tpo';
  const showBranchColumn = isMainTpo;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [baseRows, setBaseRows] = useState([]);

  const [filters, setFilters] = useState({
    job_role: '',
    year: '',
    branch: isMainTpo ? '' : user.branch,
  });

  const jobRoleOptions = useMemo(() => {
    const pool = baseRows.filter((item) => {
      const matchesRole = isMainTpo ? true : item.branch === user.branch;
      const matchesYear = filters.year ? Number(item.placement_year) === Number(filters.year) : true;
      const matchesBranch = filters.branch ? item.branch === filters.branch : true;
      return matchesRole && matchesYear && matchesBranch;
    });

    return [...new Set(pool.map((item) => item.job_role).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [baseRows, filters.year, filters.branch, isMainTpo, user.branch]);

  const yearOptions = useMemo(() => {
    const pool = baseRows.filter((item) => {
      const matchesRole = isMainTpo ? true : item.branch === user.branch;
      const matchesJobRole = filters.job_role ? item.job_role === filters.job_role : true;
      const matchesBranch = filters.branch ? item.branch === filters.branch : true;
      return matchesRole && matchesJobRole && matchesBranch;
    });

    return [...new Set(pool.map((item) => Number(item.placement_year)).filter(Number.isFinite))].sort((a, b) => b - a);
  }, [baseRows, filters.job_role, filters.branch, isMainTpo, user.branch]);

  const branchOptions = useMemo(() => {
    const pool = baseRows.filter((item) => {
      const matchesRole = isMainTpo ? true : item.branch === user.branch;
      const matchesJobRole = filters.job_role ? item.job_role === filters.job_role : true;
      const matchesYear = filters.year ? Number(item.placement_year) === Number(filters.year) : true;
      return matchesRole && matchesJobRole && matchesYear;
    });

    return [...new Set(pool.map((item) => item.branch).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [baseRows, filters.job_role, filters.year, isMainTpo, user.branch]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return rows.slice(start, start + itemsPerPage);
  }, [rows, currentPage]);

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

  const columns = useMemo(() => {
    const baseColumns = [
      { key: 'student_id', header: 'Student ID', width: showBranchColumn ? '16%' : '20%' },
      { key: 'company_name', header: 'Company', width: showBranchColumn ? '24%' : '26%' },
      { key: 'job_role', header: 'Job Role', width: showBranchColumn ? '24%' : '28%' },
      {
        key: 'package_lpa',
        header: 'Package',
        width: '14%',
        render: (row) => Number(row.package_lpa || 0).toFixed(2),
      },
      { key: 'placement_year', header: 'Year', width: '10%' },
    ];

    if (!showBranchColumn) {
      return baseColumns;
    }

    return [
      baseColumns[0],
      { key: 'branch', header: 'Branch', width: '18%' },
      ...baseColumns.slice(1),
    ];
  }, [showBranchColumn]);

  const fetchPlacements = async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const params = { role: user.role };

      if (user.role === 'branch_tpo') {
        params.branch = user.branch;
      } else if (nextFilters.branch) {
        params.branch = nextFilters.branch;
      }

      if (nextFilters.job_role) params.job_role = nextFilters.job_role;
      if (nextFilters.year) params.year = Number(nextFilters.year);

      const response = await placementService.getPlacements(params);
      const payload = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

      setRows(payload);
      setCurrentPage(1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch placement records.');
      setRows([]);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseRows = async () => {
    try {
      const params = { role: user.role };
      if (user.role === 'branch_tpo') {
        params.branch = user.branch;
      }

      const response = await placementService.getPlacements(params);
      const payload = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

      setBaseRows(payload);
    } catch (err) {
      setBaseRows([]);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await fetchBaseRows();
        await fetchPlacements(filters);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load dashboard data.');
      }
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPlacements(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.job_role, filters.year, filters.branch]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (filters.job_role && !jobRoleOptions.includes(filters.job_role)) {
      setFilters((prev) => ({ ...prev, job_role: '' }));
    }
  }, [filters.job_role, jobRoleOptions]);

  useEffect(() => {
    if (filters.year && !yearOptions.includes(Number(filters.year))) {
      setFilters((prev) => ({ ...prev, year: '' }));
    }
  }, [filters.year, yearOptions]);

  useEffect(() => {
    if (filters.branch && !branchOptions.includes(filters.branch)) {
      setFilters((prev) => ({ ...prev, branch: isMainTpo ? '' : user.branch }));
    }
  }, [filters.branch, branchOptions, isMainTpo, user.branch]);

  const setFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-100">
      <Sidebar />

      <main className="px-4 py-6 lg:ml-72 lg:px-8 lg:py-8">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Placement Management System</h1>
          <p className="mt-1 text-sm text-slate-600">Placement Dashboard</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Placement Records</h2>
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              {rows.length} records
            </span>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select
              value={filters.job_role}
              onChange={(event) => setFilter('job_role', event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-200 focus:ring"
            >
              <option value="">All Job Roles</option>
              {jobRoleOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <select
              value={filters.year}
              onChange={(event) => setFilter('year', event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-200 focus:ring"
            >
              <option value="">All Years</option>
              {yearOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            {isMainTpo ? (
              <select
                value={filters.branch}
                onChange={(event) => setFilter('branch', event.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-200 focus:ring"
              >
                <option value="">All Branches</option>
                {branchOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-cyan-600" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
              No Data Found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <Table columns={columns} rows={paginatedRows} emptyLabel="No placement records found." />
              </div>

              {rows.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, rows.length)} of {rows.length}
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
      </main>
    </div>
  );
}
