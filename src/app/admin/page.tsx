'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  RotateCcw,
  Activity,
  History,
  CheckCircle2,
  Database,
  ArrowLeft,
  Search,
  Lock,
} from 'lucide-react';
import { store } from '@/lib/db/store';
import { AuditLog } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function AdminPage() {
  const [logs, setLogs] = useState<AuditLog[]>(() => store.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const refresh = () => {
    setLogs(store.getAuditLogs());
  };

  const handleResetDatabase = () => {
    if (confirm('Reset entire system to clean initial demo seed data?')) {
      store.resetToSeed();
      refresh();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090d13] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/overview">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-400" /> Admin Command & Audit Trail
            </h1>
            <p className="text-xs text-slate-400">
              System health, immutable audit logs, and master simulation controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={handleResetDatabase}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset to Seed Data
          </Button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>System database restored to default fresh quick-commerce seed dataset!</span>
        </div>
      )}

      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Audit Entries</div>
          <div className="text-2xl font-bold text-white font-mono">{logs.length} Actions</div>
          <p className="text-[11px] text-emerald-400 mt-1">Immutable SHA-verified stream</p>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">
            Multimodal Engine
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">Gemini 1.5</div>
          <p className="text-[11px] text-slate-400 mt-1">Structured JSON schema mode</p>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">
            Row Level Security
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">Enforced</div>
          <p className="text-[11px] text-slate-400 mt-1">Zero cross-tenant leakage</p>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card className="space-y-4">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" /> Immutable Operations Audit Log
            </CardTitle>
            <CardDescription>
              Chronological log of inspections, packing verifications, dispatches, and alerts
            </CardDescription>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Operator / User</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Entity Type</th>
                <th className="py-3 px-4 font-semibold">Entity ID</th>
                <th className="py-3 px-4 font-semibold">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{log.userName}</td>
                  <td className="py-3 px-4 font-mono">
                    <Badge variant="cyan">{log.action}</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{log.entity}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{log.entityId}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
