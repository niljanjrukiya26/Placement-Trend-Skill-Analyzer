import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

const pieColors = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function Chart({ type = 'bar', data = [], xDataKey, yDataKey, lineColor = '#0284c7' }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey={xDataKey} stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Line type="monotone" dataKey={yDataKey} stroke={lineColor} strokeWidth={3} />
          </LineChart>
        ) : type === 'pie' ? (
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie data={data} dataKey={yDataKey} nameKey={xDataKey} cx="50%" cy="50%" outerRadius={90} label>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
          </PieChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey={xDataKey} stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Bar dataKey={yDataKey} radius={[8, 8, 0, 0]} fill="#0284c7" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
