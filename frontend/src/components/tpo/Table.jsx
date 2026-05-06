import React from 'react';

export default function Table({ columns, rows, emptyLabel = 'No records found.' }) {
  if (!rows?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <table className="w-full table-fixed divide-y divide-slate-200 border-collapse">
      <thead className="bg-slate-50">
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 align-top"
              style={column.width ? { width: column.width } : {}}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {rows.map((row, index) => (
          <tr key={row.id || index} className="hover:bg-slate-50">
            {columns.map((column) => (
              <td
                key={column.key}
                className={`px-4 py-3 text-sm text-slate-700 align-top text-center ${
                  column.key === 'domain' || column.key === 'job_role'
                    ? 'whitespace-normal break-words'
                    : 'overflow-hidden text-ellipsis'
                }`}
                style={column.width ? { width: column.width } : {}}
              >
                {column.render ? column.render(row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
