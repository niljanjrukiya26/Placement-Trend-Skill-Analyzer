import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Target, Sparkles, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import Sidebar from '../components/Sidebar';
import CircularProgress from '../components/CircularProgress';
import { authUtils } from '../utils/auth';

function clampPercentage(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

function buildChartData(domainProbabilities) {
  return Object.entries(domainProbabilities || {})
    .map(([domain, probability]) => ({
      domain,
      probability: Number.isFinite(Number(probability)) ? clampPercentage(probability) : null,
    }))
    .filter((row) => row.probability !== null && row.probability > 0)
    .sort((a, b) => b.probability - a.probability);
}

function formatLabel(text) {
  if (!text) return 'N/A';
  return text;
}

export default function PlacementPrediction() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const chartRows = useMemo(
    () => buildChartData(prediction?.domain_probabilities),
    [prediction]
  );

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError('');

        const userid = authUtils.getUserId();
        if (!userid) {
          throw new Error('User ID not found. Please login again.');
        }

        const token = authUtils.getToken();
        const response = await fetch(`/predict-placement/${userid}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || 'Failed to fetch placement prediction');
        }

        setPrediction(payload?.data || null);
      } catch (err) {
        setError(err?.message || 'Failed to fetch placement prediction');
        setPrediction(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, []);

  const overallProbability = clampPercentage(prediction?.overall_probability);
  const bestDomain = formatLabel(prediction?.best_domain);
  const compatibleCompanies = Array.isArray(prediction?.compatible_companies)
    ? prediction.compatible_companies
    : [];
  const uniqueCompanies = useMemo(() => {
    const seen = new Set();
    return compatibleCompanies.filter((company) => {
      const companyName = String(company?.company_name || '').trim();
      if (!companyName) return false;
      const normalized = companyName.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [compatibleCompanies]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />
      <div className="lg:ml-72 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Placement Prediction
              </span>
            </h1>
            <p className="text-gray-600 mt-2 font-medium">
              AI-based domain fit analysis and weighted placement probability
            </p>
          </div>

          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <div className="h-5 bg-gray-200 rounded w-56 mb-6" />
                <div className="flex items-center gap-8 flex-wrap">
                  <div className="w-44 h-44 rounded-full bg-gray-200" />
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-40" />
                    <div className="h-4 bg-gray-200 rounded w-72" />
                    <div className="h-4 bg-gray-200 rounded w-64" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <div className="h-6 bg-gray-200 rounded w-52 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-80 mb-6" />
                <div className="h-[300px] bg-gray-100 rounded-xl" />
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <div className="h-6 bg-gray-200 rounded w-40 mb-5" />
                <div className="h-4 bg-gray-200 rounded w-64 mb-5" />
                <div className="space-y-3">
                  <div className="h-12 bg-gray-100 rounded-xl" />
                  <div className="h-12 bg-gray-100 rounded-xl" />
                  <div className="h-12 bg-gray-100 rounded-xl" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 flex items-start">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3 mt-0.5" />
              <div>
                <h2 className="text-red-700 font-bold">Prediction Error</h2>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white rounded-2xl shadow-xl p-8 mb-8">
                <p className="text-blue-100 font-semibold mb-4">Overall Placement Chance</p>
                <div className="flex items-center gap-8 flex-wrap">
                  <CircularProgress value={overallProbability} label="Overall Placement Chance" />
                  <div>
                    <h2 className="text-2xl font-bold">Prediction Score</h2>
                    <p className="text-blue-100 mt-2 max-w-md">
                      This score combines ML placement likelihood with domain readiness weighting from your skills.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Best Domain</h3>
                  <Target className="w-5 h-5 text-indigo-600" />
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-4">
                  <p className="text-2xl font-bold text-indigo-700 break-words">{bestDomain}</p>
                  <span className="inline-flex mt-3 items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Recommended Domain
                  </span>
                </div>

                <div className="my-5 border-t border-slate-200" />

                <h4 className="text-lg font-bold text-gray-900 mb-1">Recommended Companies</h4>
                <p className="text-gray-500 mb-4">Companies compatible with your best domain and CGPA</p>

                {uniqueCompanies.length > 0 ? (
                  <div className="grid [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] gap-3">
                    {uniqueCompanies.map((company, index) => (
                      <div
                        key={`${String(company.company_name || 'company').toLowerCase()}-${index}`}
                        className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-4"
                      >
                        <p className="text-base font-bold text-indigo-800">{company.company_name || 'Unnamed Company'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No compatible companies found for your current best domain and CGPA.</p>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Domain Wise Probability</h3>
                <p className="text-gray-500 mb-6">Horizontal comparison of placement probability by domain</p>

                {chartRows.length > 0 ? (
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartRows} layout="vertical" margin={{ top: 8, right: 16, left: 40, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis type="category" dataKey="domain" width={180} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Probability']} />
                        <Bar dataKey="probability" fill="#4f46e5" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-600">No domain probability data available.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
