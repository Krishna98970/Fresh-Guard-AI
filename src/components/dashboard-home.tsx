'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardCheck, Package, ScanLine, Truck, XCircle } from 'lucide-react';
import { getDashboardMetrics, getInspectionHistory, type DashboardMetrics } from '@/lib/api';
import type { InspectionResult } from '@/lib/mockAI';
import { formatDateInUtc } from '@/lib/utils';

export default function DashboardHome() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recent, setRecent] = useState<InspectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getDashboardMetrics(), getInspectionHistory()])
      .then(([dashboard, inspections]) => {
        if (!active) return;
        setMetrics(dashboard);
        setRecent(inspections.slice(0, 5));
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Dashboard data could not be loaded.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = metrics ? [
    { label: 'Total inspections', value: metrics.total_inspections, detail: 'Persisted records', Icon: ClipboardCheck },
    { label: 'Accepted products', value: metrics.fresh_count, detail: `${metrics.fresh_rate}% acceptance rate`, Icon: CheckCircle2 },
    { label: 'Needs review', value: metrics.review_count, detail: 'Awaiting quality review', Icon: ScanLine },
    { label: 'Rejected', value: metrics.rejected_count, detail: `${metrics.reject_rate}% rejection rate`, Icon: XCircle },
    { label: 'Ready to dispatch', value: metrics.ready_for_dispatch, detail: 'Inspection + packing passed', Icon: Package },
    { label: 'In transit', value: metrics.in_transit, detail: `${metrics.delayed} delayed`, Icon: Truck },
  ] : [];

  return (
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold text-emerald-700">Warehouse operations</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Quality and delivery overview</h1>
            <p className="mt-2 text-slate-500">Live metrics from saved warehouse records.</p>
          </div>
          <Link href="/inspect" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700">
            <ScanLine size={18} />New inspection
          </Link>
        </div>

        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map(({ label, value, detail, Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><Icon size={18} /></span>
              </div>
              <div className="mt-5 text-3xl font-bold tracking-tight">{loading ? '—' : value}</div>
              <p className="mt-1 text-xs text-slate-400">{detail}</p>
            </div>
          ))}
          {metrics && <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-medium text-slate-500">Transit alerts</div>
            <div className="mt-5 text-3xl font-bold tracking-tight">{metrics.temperature_alerts + metrics.transit_alerts}</div>
            <p className="mt-1 text-xs text-slate-400">Unresolved temperature and handling alerts</p>
          </div>}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="font-bold">Recent inspections</h2>
              <p className="mt-1 text-sm text-slate-500">Latest saved model decisions.</p>
            </div>
            <Link href="/history" className="text-sm font-bold text-emerald-700">View history <ArrowRight className="ml-1 inline" size={15} /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr><th className="px-5 py-3">ID</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Decision</th><th className="px-5 py-3">Time</th></tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.inspectionId} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold">{item.inspectionId}</td>
                    <td className="px-5 py-4">{item.product}</td>
                    <td className="px-5 py-4 font-bold">{item.qualityScore}/100</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.decision === 'ACCEPT' ? 'bg-emerald-50 text-emerald-700' : item.decision === 'REJECT' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{item.decision}</span></td>
                    <td className="px-5 py-4 text-slate-500">{formatDateInUtc(item.timestamp, { hour: 'numeric', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !error && !recent.length && <p className="p-8 text-center text-sm text-slate-500">No inspections have been saved yet.</p>}
            {loading && <p className="p-8 text-center text-sm text-slate-500">Loading warehouse records…</p>}
          </div>
        </section>
      </div>
  );
}
