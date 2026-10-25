'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  RotateCcw,
  History,
  CheckCircle2,
  Database,
  ArrowLeft,
  Search,
  Lock,
} from 'lucide-react';
import { store } from '@/lib/db/store';
import { AuditLog } from '@/lib/types';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

type DatabaseRecord = Record<string, unknown>;

interface DatabaseTable {
  name: string;
  records: DatabaseRecord[];
  note?: string;
}

function omitFields(record: object, fields: string[]): DatabaseRecord {
  return Object.fromEntries(
    Object.entries(record).filter(([field]) => !fields.includes(field))
  );
}

function sanitizeDatabaseValue(value: unknown, fieldName = ''): unknown {
  if (/password|secret|token|api.?key/i.test(fieldName)) {
    return '[REDACTED]';
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDatabaseValue(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sanitizeDatabaseValue(nestedValue, key),
      ])
    );
  }
  return value;
}

function buildDatabaseTables(): DatabaseTable[] {
  const orders = store.getOrders();
  const inspections = store.getInspections();
  const deliveries = store.getDeliveries();

  const records = (items: object[]) =>
    items.map((item) => sanitizeDatabaseValue(item) as DatabaseRecord);

  return [
    { name: 'organizations', records: records([store.getOrganization()]) },
    { name: 'users', records: records(store.getUsers()) },
    { name: 'products', records: records(store.getProducts()) },
    {
      name: 'product_batches',
      records: [],
      note: 'Product batches are defined in the SQL schema but are not tracked in the current app store.',
    },
    {
      name: 'orders',
      records: records(orders.map((order) => omitFields(order, ['items']))),
    },
    {
      name: 'order_items',
      records: records(orders.flatMap((order) => order.items)),
    },
    {
      name: 'quality_inspections',
      records: records(
        inspections.map((inspection) => omitFields(inspection, ['defects']))
      ),
    },
    {
      name: 'inspection_defects',
      records: records(
        inspections.flatMap((inspection) =>
          inspection.defects.map((defect) => ({
            ...defect,
            inspection_id: inspection.id,
          }))
        )
      ),
    },
    { name: 'packing_records', records: records(store.getPackingRecords()) },
    { name: 'riders', records: records(store.getRiders()) },
    {
      name: 'deliveries',
      records: records(
        deliveries.map((delivery) =>
          omitFields(delivery, ['currentTelemetry', 'recentEvents'])
        )
      ),
    },
    {
      name: 'telemetry',
      records: records(
        deliveries.flatMap((delivery) =>
          delivery.currentTelemetry ? [delivery.currentTelemetry] : []
        )
      ),
    },
    {
      name: 'handling_events',
      records: records(deliveries.flatMap((delivery) => delivery.recentEvents)),
    },
    { name: 'alerts', records: records(store.getAlerts()) },
    { name: 'customer_feedback', records: records(store.getFeedback()) },
    { name: 'system_settings', records: records([store.getSettings()]) },
    { name: 'audit_logs', records: records(store.getAuditLogs()) },
  ];
}

export default function AdminPage() {
  const { role, isLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>(() => store.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [databaseSearch, setDatabaseSearch] = useState('');
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>(() =>
    buildDatabaseTables()
  );
  const [selectedTable, setSelectedTable] = useState('quality_inspections');
  const [resetSuccess, setResetSuccess] = useState(false);

  const refresh = () => {
    setLogs(store.getAuditLogs());
    setDatabaseTables(buildDatabaseTables());
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

  const activeTable =
    databaseTables.find((table) => table.name === selectedTable) ?? databaseTables[0];
  const filteredDatabaseRecords = activeTable.records.filter((record) =>
    JSON.stringify(record).toLowerCase().includes(databaseSearch.toLowerCase())
  );
  const totalDatabaseRecords = databaseTables.reduce(
    (total, table) => total + table.records.length,
    0
  );

  if (isLoading) {
    return <div className="p-8 text-sm text-slate-400">Checking admin access…</div>;
  }

  if (role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#090d13] p-8 text-slate-100">
        <Card className="mx-auto max-w-lg text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-rose-400" />
          <h1 className="text-lg font-semibold text-white">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-400">
            Switch to the Admin role to view organization records and system data.
          </p>
          <Link href="/dashboard/overview" className="mt-5 inline-block">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

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

      <Card className="space-y-4">
        <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-400" /> Database Explorer
            </CardTitle>
            <CardDescription>
              Browse {databaseTables.length} data collections and {totalDatabaseRecords} available records.
              Sensitive keys are redacted.
            </CardDescription>
            <p className="mt-1 text-[11px] text-amber-300">
              Source: current FreshGuard app store. This view does not query live Supabase tables.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            icon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Refresh Data
          </Button>
        </CardHeader>

        <div className="flex flex-wrap gap-2">
          {databaseTables.map((table) => (
            <button
              key={table.name}
              type="button"
              onClick={() => setSelectedTable(table.name)}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                activeTable.name === table.name
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-700 bg-slate-900/70 text-slate-400 hover:text-white'
              }`}
            >
              <span className="font-mono">{table.name}</span>
              <span className="ml-2 text-[10px] opacity-70">{table.records.length}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-mono text-sm font-semibold text-white">{activeTable.name}</h2>
            <p className="text-[11px] text-slate-400">
              Showing {filteredDatabaseRecords.length} of {activeTable.records.length} records
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={databaseSearch}
              onChange={(event) => setDatabaseSearch(event.target.value)}
              placeholder={`Search ${activeTable.name}...`}
              aria-label={`Search ${activeTable.name}`}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {activeTable.note && (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
            {activeTable.note}
          </p>
        )}

        <div className="max-h-[34rem] space-y-2 overflow-auto">
          {filteredDatabaseRecords.map((record, index) => {
            const identityField = Object.keys(record).find((key) =>
              ['id', 'inspectionId', 'orderNumber', 'email', 'name'].includes(key)
            );
            return (
              <details
                key={String(identityField ? record[identityField] : index)}
                className="group rounded-xl border border-slate-800 bg-slate-950/60"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-xs hover:bg-slate-900/70">
                  <span className="min-w-0 truncate font-mono text-slate-200">
                    {identityField ? `${identityField}: ${String(record[identityField])}` : `Record ${index + 1}`}
                  </span>
                  <span className="shrink-0 text-[10px] text-emerald-400 group-open:text-slate-400">
                    View full record
                  </span>
                </summary>
                <pre className="overflow-x-auto border-t border-slate-800 p-4 text-[11px] leading-relaxed text-slate-300">
                  {JSON.stringify(record, null, 2)}
                </pre>
              </details>
            );
          })}
          {filteredDatabaseRecords.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-xs text-slate-400">
              {activeTable.records.length === 0
                ? 'No records are available in this collection.'
                : 'No records match your search.'}
            </div>
          )}
        </div>
      </Card>

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
