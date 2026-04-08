import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { placementService } from '../../services/api';
import { authUtils } from '../../utils/auth';
import { normalizeRole, ROLES } from '../../utils/tpo/roles';

export default function PlacementTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    job_role: '',
    placement_year: '',
    branch: '',
  });

  const normalizedRole = normalizeRole(authUtils.getUserRole());
  const isMainTpo = normalizedRole === ROLES.MAIN_TPO;
  const showBranchColumn = isMainTpo;

  const jobRoleOptions = useMemo(
    () => [...new Set(rows.map((item) => item.job_role).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const yearOptions = useMemo(
    () =>
      [...new Set(rows.map((item) => Number(item.placement_year)).filter(Number.isFinite))].sort((a, b) => b - a),
    [rows]
  );

  const branchOptions = useMemo(
    () => [...new Set(rows.map((item) => item.branch).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const fetchRows = async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (nextFilters.job_role) params.job_role = nextFilters.job_role;
      if (nextFilters.placement_year) params.placement_year = Number(nextFilters.placement_year);
      if (isMainTpo && nextFilters.branch) params.branch = nextFilters.branch;

      const response = await placementService.getPlacements(params);
      const payload = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

      setRows(payload);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch placement records.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchRows(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.job_role, filters.placement_year, filters.branch, isMainTpo]);

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      job_role: '',
      placement_year: '',
      branch: '',
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900">Placement Records</h2>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          {rows.length} records
        </span>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <select
          value={filters.job_role}
          onChange={(event) => updateFilter('job_role', event.target.value)}
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
          value={filters.placement_year}
          onChange={(event) => updateFilter('placement_year', event.target.value)}
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
            onChange={(event) => updateFilter('branch', event.target.value)}
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
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student ID</th>
                {showBranchColumn && (
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Branch</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Job Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Package (LPA)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, index) => (
                <tr key={`${row.student_id}-${row.company_name}-${row.placement_year}-${index}`} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-700">{row.student_id}</td>
                  {showBranchColumn && <td className="px-4 py-3 text-sm text-slate-700">{row.branch}</td>}
                  <td className="px-4 py-3 text-sm text-slate-700">{row.company_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.job_role}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{Number(row.package_lpa || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.placement_year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
