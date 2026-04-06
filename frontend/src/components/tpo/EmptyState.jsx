import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing to show', description = 'No data available for this section.' }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <Inbox className="mx-auto mb-3 h-8 w-8 text-slate-400" />
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
