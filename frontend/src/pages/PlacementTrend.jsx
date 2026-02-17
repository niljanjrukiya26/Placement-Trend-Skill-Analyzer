/**
 * Placement Trend Analysis Page
 * Displays year-wise and branch-wise placement statistics with charts
 * Uses Recharts for visualization
 */
import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { AlertCircle, TrendingUp, Award, BarChart3 } from 'lucide-react';

export default function PlacementTrend() {
  const [yearwiseData, setYearwiseData] = useState([]);
  const [branchwiseData, setBranchwiseData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for Package Statistics
  const [packageStats, setPackageStats] = useState({
    highestAllYears: null,
    averageAllYears: null,
    highestLastYear: null,
    averageLastYear: null,
  });

  // Fetch year-wise data on mount
  useEffect(() => {
    fetchYearwiseData();
    fetchPackageStatistics();
  }, []);

  // Fetch branch-wise data when selectedYear changes
  useEffect(() => {
    if (selectedYear !== null) {
      fetchBranchwiseData(selectedYear);
    }
  }, [selectedYear]);

  const fetchYearwiseData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch year-wise data
      const yearResponse = await analyticsService.getYearwisePlacement();
      const rawData = yearResponse.data.data;

      // Clean and sort data: filter only valid years and sort ascending
      const cleanedData = rawData
        .filter(item => {
          // Ensure year is a valid number (not null, undefined, or non-numeric string)
          return item.year && typeof item.year === 'number' && Number.isInteger(item.year);
        })
        .sort((a, b) => a.year - b.year);

      setYearwiseData(cleanedData);

      // Set selectedYear to the latest year from cleaned database
      if (cleanedData && cleanedData.length > 0) {
        const latestYear = Math.max(...cleanedData.map(item => item.year));
        setSelectedYear(latestYear);
      }
    } catch (err) {
      setError('Failed to load placement data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchwiseData = async (year) => {
    try {
      // Fetch branch-wise data for selected year
      const branchResponse = await analyticsService.getBranchwisePlacement(year);
      setBranchwiseData(branchResponse.data.data);
    } catch (err) {
      console.error('Failed to load branch-wise data:', err);
      setBranchwiseData([]);
    }
  };

  /**
   * Fetch package statistics from backend API
   * Backend filters only placed_status=true AND package_lpa IS NOT null
   * Returns highest/average for all years and last year
   */
  const fetchPackageStatistics = async () => {
    try {
      const response = await analyticsService.getPackageStatistics();
      
      if (response.data.data) {
        const stats = response.data.data;
        
        setPackageStats({
          highestAllYears: stats.highestAllYears || null,
          averageAllYears: stats.averageAllYears || null,
          highestLastYear: stats.highestLastYear || null,
          averageLastYear: stats.averageLastYear || null,
        });
      } else {
        // Handle empty response
        setPackageStats({
          highestAllYears: null,
          averageAllYears: null,
          highestLastYear: null,
          averageLastYear: null,
        });
      }
    } catch (err) {
      console.error('Failed to load package statistics:', err);
      setPackageStats({
        highestAllYears: null,
        averageAllYears: null,
        highestLastYear: null,
        averageLastYear: null,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Sidebar />
        <div className="lg:ml-72 transition-all duration-300">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading analytics...</p>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />
      <div className="lg:ml-72 transition-all duration-300">

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Placement Trends
            </span>
          </h1>
          <p className="text-gray-600 mt-2 font-medium">
            Year-wise and branch-wise placement analysis for strategic planning
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Year-wise Placement Chart */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Year-wise Placement Statistics
          </h2>

          {yearwiseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yearwiseData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                {/* XAxis: Only renders labels from the actual data (yearwiseData) */}
                <XAxis 
                  dataKey="year"
                  type="number"
                  allowDecimals={false}
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis />
                <Tooltip formatter={(value) => value} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="placed_students"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Placed Students"
                  dot={{ fill: '#3b82f6', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 py-8 text-center">
              No data available
            </p>
          )}

          {/* Year-wise Table */}
          {yearwiseData.length > 0 && (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-900">
                      Year
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-gray-900">
                      Total Students
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-gray-900">
                      Placed
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-gray-900">
                      Placement %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {yearwiseData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-blue-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">{row.year}</td>
                      <td className="px-4 py-3 text-center font-medium text-gray-600">
                        {row.total_students}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-green-600">
                        {row.placed_students}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-600">
                        {row.placement_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Branch-wise Placement Chart */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Branch-wise Placement ({selectedYear})
            </h2>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
            >
              {yearwiseData.map((row) => (
                <option key={row.year} value={row.year}>
                  {row.year}
                </option>
              ))}
            </select>
          </div>

          {branchwiseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchwiseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="placed_students"
                  fill="#3b82f6"
                  name="Placed"
                />
                <Bar
                  dataKey="total_students"
                  fill="#f59e0b"
                  name="Total Appeared"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 py-8 text-center">
              No data available for the selected year
            </p>
          )}

          {/* Branch-wise Table */}
          {branchwiseData.length > 0 && (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-900">
                      Branch
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-gray-900">
                      Total Students
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-gray-900">
                      Placed
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-gray-900">
                      Placement %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {branchwiseData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-blue-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 font-bold text-gray-800">{row.branch}</td>
                      <td className="px-4 py-3 text-center font-medium text-gray-600">
                        {row.total_students}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-green-600">
                        {row.placed_students}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-600">
                        {row.placement_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Package Statistics Section - Dashboard-consistent styling */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mr-3">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            Package Statistics
          </h2>

          {/* 2x2 Grid Layout - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Highest Package (All Years) */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Highest Package</p>
                  <p className="text-gray-500 text-xs">(All Years)</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-extrabold text-blue-600">
                  {packageStats.highestAllYears ? packageStats.highestAllYears.toFixed(2) : 'N/A'}
                </p>
                <p className="text-lg font-semibold text-gray-600">LPA</p>
              </div>
              <p className="text-gray-400 text-xs mt-4">Peak package offered across all years</p>
            </div>

            {/* Card 2: Average Package (All Years) */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Average Package</p>
                  <p className="text-gray-500 text-xs">(All Years)</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-extrabold text-indigo-600">
                  {packageStats.averageAllYears ? packageStats.averageAllYears.toFixed(2) : 'N/A'}
                </p>
                <p className="text-lg font-semibold text-gray-600">LPA</p>
              </div>
              <p className="text-gray-400 text-xs mt-4">Mean package across all placement years</p>
            </div>

            {/* Card 3: Highest Package (Last Year) */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Highest Package</p>
                  <p className="text-gray-500 text-xs">(Last Year)</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-extrabold text-purple-600">
                  {packageStats.highestLastYear ? packageStats.highestLastYear.toFixed(2) : 'N/A'}
                </p>
                <p className="text-lg font-semibold text-gray-600">LPA</p>
              </div>
              <p className="text-gray-400 text-xs mt-4">Maximum package in the most recent year</p>
            </div>

            {/* Card 4: Average Package (Last Year) */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Average Package</p>
                  <p className="text-gray-500 text-xs">(Last Year)</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-pink-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-extrabold text-pink-600">
                  {packageStats.averageLastYear ? packageStats.averageLastYear.toFixed(2) : 'N/A'}
                </p>
                <p className="text-lg font-semibold text-gray-600">LPA</p>
              </div>
              <p className="text-gray-400 text-xs mt-4">Average package offered in the latest year</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
