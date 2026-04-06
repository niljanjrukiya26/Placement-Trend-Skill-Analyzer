import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied({ message = 'You do not have permission to access this page.' }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
      <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-rose-500" />
      <h2 className="text-lg font-semibold text-rose-700">Access Restricted</h2>
      <p className="mt-2 text-sm text-rose-600">{message}</p>
    </div>
  );
}
