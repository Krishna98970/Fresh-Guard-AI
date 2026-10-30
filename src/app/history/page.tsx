'use client';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { FreshGuardShell } from '@/components/freshguard-shell';
import { getInspectionHistory } from '@/lib/api';
import { formatDateInUtc } from '@/lib/utils';
import type { InspectionResult } from '@/lib/mockAI';

export default function HistoryPage() {
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<InspectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getInspectionHistory()
      .then((items) => { if (active) setRecords(items); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Inspection history could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const filtered = records.filter((r) =>
    `${r.inspectionId} ${r.product} ${r.employeeId} ${r.condition}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <FreshGuardShell>
      <div className="space-y-7">
        <div>
          <p className="mb-2 text-sm font-semibold text-emerald-700">Quality records</p>
          <h1 className="text-3xl font-bold">Inspection history</h1>
          <p className="mt-2 text-slate-500">Search previous visual inspection decisions and scores.</p>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ID, product or employee..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                {['Inspection ID', 'Date', 'Product', 'Score', 'Status', 'Employee', 'Action'].map((head) => (
                  <th key={head} className="px-5 py-4">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.inspectionId} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-bold">{r.inspectionId}</td>
                  <td className="px-5 py-4 text-slate-500">
                    {formatDateInUtc(r.timestamp, { month: 'numeric', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">{r.product}</td>
                  <td className="px-5 py-4 font-bold">{r.qualityScore}/100</td>
                  <td className="px-5 py-4"><span className="font-semibold">{r.condition}</span></td>
                  <td className="px-5 py-4 text-slate-500">{r.employeeId}</td>
                  <td className="px-5 py-4 font-bold text-emerald-700">View</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !error && !filtered.length && <p className="p-10 text-center text-sm text-slate-500">No inspections yet. Start your first produce inspection.</p>}
          {loading && <p className="p-10 text-center text-sm text-slate-500">Loading inspection history…</p>}
          {error && <p role="alert" className="p-4 text-sm font-semibold text-rose-700">{error}</p>}
        </div>
      </div>
    </FreshGuardShell>
  );
}
