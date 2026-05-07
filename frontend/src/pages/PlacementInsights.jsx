import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building2, GraduationCap, Users } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { analyticsService } from '../services/api';

function formatCgpa(value) {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : 'N/A';
}

function formatPackage(value) {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  const num = Number(value);
  return Number.isFinite(num) ? `${num.toFixed(2)} LPA` : 'N/A';
}

export default function PlacementInsights() {
  const navigate = useNavigate();
  const { jobRole } = useParams();

  const selectedJobRole = useMemo(() => decodeURIComponent(jobRole || ''), [jobRole]);

  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const yearFirstInsights = useMemo(() => insights, [insights]);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await analyticsService.getPlacementInsights(selectedJobRole);
        setInsights(response.data?.data || []);
      } catch (err) {
        setInsights([]);
        setError(err.response?.data?.message || 'Failed to load placement insights');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [selectedJobRole]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />

      <div className="lg:ml-72 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center text-sm font-semibold text-[#4f46e5] hover:text-[#4338ca]"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </button>

          <section className="rounded-2xl border border-[#e0e7ff] bg-gradient-to-r from-white to-[#eef2ff] p-5 shadow-sm md:p-6">
            <h1 className="flex flex-wrap items-center gap-y-2 text-2xl font-bold text-slate-900 md:text-3xl">
              <span className="mr-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#e0e7ff] to-[#c7d2fe]">
                <Building2 className="h-5 w-5 text-[#4f46e5]" />
              </span>
              Placement Insights:
              <span className="ml-2 rounded-lg border border-[#c7d2fe] bg-[#eef2ff] px-3 py-1 text-xl text-[#4f46e5] md:text-2xl">
                {selectedJobRole}
              </span>
            </h1>
            <p className="mt-2 text-sm text-slate-600 md:mt-3">
              Company-wise placement outcomes grouped by branch and year
            </p>
          </section>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mx-auto mb-3 h-11 w-11 animate-spin rounded-full border-4 border-[#c7d2fe] border-t-[#4f46e5]"></div>
                <p className="font-medium text-slate-600">Loading insights...</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="mt-6 flex items-start rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <AlertCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="font-medium text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && insights.length === 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white py-14 text-center shadow-sm">
              <Users className="mx-auto mb-3 h-11 w-11 text-slate-400" />
              <p className="font-semibold text-slate-700">No placement insights found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try another role or verify records with placed_status set to true
              </p>
            </div>
          )}

          {!loading && !error && yearFirstInsights.length > 0 && (
            <div className="mt-7 space-y-6">
              {yearFirstInsights.map((company) => (
                <section
                  key={company.company_name}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
                >
                  <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                      {company.company_name}
                    </h3>
                    <span className="rounded-full border border-[#c7d2fe] bg-[#eef2ff] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#4f46e5]">
                      Company
                    </span>
                  </header>

                  <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(350px,1fr))]">
                    {(company.years || []).map((yearBucket) => (
                      <div
                        key={`${company.company_name}-${yearBucket.year}`}
                        className="rounded-xl border border-[#bfdbfe] bg-gradient-to-r from-[#eff6ff] to-[#f1f5f9] p-4 md:p-5"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                          <p className="text-base font-bold text-[#1d4ed8]">Year {yearBucket.year}</p>
                          <span className="rounded-full bg-white border border-[#bfdbfe] px-3 py-1 text-xs font-semibold text-[#4f46e5] uppercase tracking-wide">
                            Year Group
                          </span>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="placement-stats text-sm text-slate-700">
                            <div className="stat-row">
                              <span className="stat-label">Required CGPA</span>
                              <span className="stat-value">{formatCgpa(yearBucket.required_cgpa)}</span>
                            </div>
                            <div className="stat-row">
                              <span className="stat-label">Min Package</span>
                              <span className="stat-value">{formatPackage(yearBucket.min_pkg)}</span>
                            </div>
                            <div className="stat-row">
                              <span className="stat-label">Max Package</span>
                              <span className="stat-value stat-value-max">{formatPackage(yearBucket.max_pkg)}</span>
                            </div>
                            <div className="stat-row">
                              <span className="stat-label">Avg Package</span>
                              <span className="stat-value">{formatPackage(yearBucket.avg_pkg)}</span>
                            </div>
                          </div>

                          <div className="mt-4 border-t border-slate-100 pt-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Branches</p>
                            <ul className="space-y-1.5">
                              {(yearBucket.branches || []).map((branchEntry) => (
                                <li
                                  key={`${company.company_name}-${yearBucket.year}-${branchEntry.branch}`}
                                  className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700"
                                >
                                  <span className="inline-flex items-center">
                                    <GraduationCap className="mr-2 h-4 w-4 text-[#4f46e5]" />
                                    {branchEntry.branch}
                                  </span>
                                  <span className="font-bold text-green-700">{branchEntry.total_hired ?? 0}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
