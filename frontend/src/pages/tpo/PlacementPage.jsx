import React from 'react';

import PlacementTable from '../../components/tpo/PlacementTable';
import Sidebar from '../../components/Sidebar';

export default function PlacementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-100">
      <Sidebar />

      <main className="px-4 py-6 lg:ml-72 lg:px-8 lg:py-8">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Placement Management System</h1>
          <p className="mt-1 text-sm text-slate-600">Placed Students Data Table</p>
        </header>

        <PlacementTable />
      </main>
    </div>
  );
}
