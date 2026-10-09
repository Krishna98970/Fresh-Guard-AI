'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  Thermometer,
  Zap,
  Clock,
  Scan,
  PackageCheck,
  Truck,
  Filter,
  CheckCheck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { store } from '@/lib/db/store';
import { Alert, AlertSeverity, AlertType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(() => store.getAlerts());
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const refresh = () => {
    setAlerts(store.getAlerts());
  };

  const handleMarkRead = (id: string) => {
    store.markAlertAsRead(id);
    refresh();
  };

  const handleMarkAllRead = () => {
    store.markAllAlertsAsRead();
    refresh();
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const filteredAlerts = alerts.filter((a) => {
    const matchSev =
      severityFilter === 'ALL'
        ? true
        : severityFilter === 'UNREAD'
        ? !a.isRead
        : a.severity === severityFilter;
    const matchType = typeFilter === 'ALL' || a.type === typeFilter;
    return matchSev && matchType;
  });

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'TEMPERATURE':
        return <Thermometer className="w-4 h-4 text-cyan-400" />;
      case 'VIBRATION':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'QUALITY':
        return <Scan className="w-4 h-4 text-rose-400" />;
      case 'DELIVERY':
        return <Truck className="w-4 h-4 text-emerald-400" />;
      case 'PACKING':
        return <PackageCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-400" /> Operations Alert Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized monitoring of cold-chain excursions, produce rejections, and transit shocks
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              icon={<CheckCheck className="w-3.5 h-3.5 text-emerald-400" />}
            >
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Severity Tabs */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 mr-2 font-semibold uppercase">Severity:</span>
            {['ALL', 'UNREAD', 'CRITICAL', 'WARNING', 'INFO'].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  severityFilter === s
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {s}
                {s === 'UNREAD' && unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Type Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <span className="text-xs text-slate-400 mr-2 font-semibold uppercase">Domain:</span>
            {['ALL', 'QUALITY', 'TEMPERATURE', 'VIBRATION', 'DELIVERY', 'PACKING', 'SYSTEM'].map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    typeFilter === t
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {t}
                </button>
              )
            )}
          </div>
        </div>
      </Card>

      {/* Alerts Feed */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No alerts in current view"
          description="All operations are running nominal. Anomaly events triggered via telemetry or inspection will surface here."
        />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alt) => (
            <div
              key={alt.id}
              className={`p-4 rounded-2xl glass-card border transition-all flex items-start justify-between gap-4 ${
                !alt.isRead
                  ? 'border-emerald-500/30 bg-gradient-to-r from-slate-900/90 to-slate-900/60'
                  : 'border-white/5 opacity-75'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                    alt.severity === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : alt.severity === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  {getTypeIcon(alt.type)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{alt.title}</span>
                    <Badge
                      variant={
                        alt.severity === 'CRITICAL'
                          ? 'rose'
                          : alt.severity === 'WARNING'
                          ? 'amber'
                          : 'cyan'
                      }
                      className="text-[10px] py-0"
                    >
                      {alt.severity}
                    </Badge>
                    <Badge variant="slate" className="text-[10px] py-0">
                      {alt.type}
                    </Badge>
                    {!alt.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                    {alt.message}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span>{formatDate(alt.createdAt)}</span>
                    <span>•</span>
                    <span>Target: {alt.entityType}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!alt.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkRead(alt.id)}
                    icon={<CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  >
                    Mark Read
                  </Button>
                )}

                {alt.type === 'TEMPERATURE' || alt.type === 'VIBRATION' ? (
                  <Link href="/dashboard/telemetry">
                    <Button size="sm" variant="secondary" icon={<ArrowRight className="w-3 h-3" />}>
                      View Stream
                    </Button>
                  </Link>
                ) : alt.type === 'QUALITY' ? (
                  <Link href="/dashboard/inspection">
                    <Button size="sm" variant="secondary" icon={<ArrowRight className="w-3 h-3" />}>
                      View Inspection
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
