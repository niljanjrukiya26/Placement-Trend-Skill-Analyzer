import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-1/3 rounded bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-28 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-slate-200" />
    </div>
  );
}
