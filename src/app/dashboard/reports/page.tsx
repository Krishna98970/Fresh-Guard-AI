'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Table,
  FileSpreadsheet,
} from 'lucide-react';
import { store } from '@/lib/db/store';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ReportType =
  | 'QUALITY'
  | 'DELIVERY'
  | 'DEFECTS'
  | 'RIDERS'
  | 'FEEDBACK';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('QUALITY');
  const [dateRange, setDateRange] = useState('LAST_30_DAYS');

  const inspections = store.getInspections();
  const deliveries = store.getDeliveries();
  const riders = store.getRiders();
  const feedback = store.getFeedback();
  const products = store.getProducts();

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `freshguard_${reportType.toLowerCase()}_report.csv`;

    switch (reportType) {
      case 'QUALITY':
        headers = ['Inspection ID', 'Product', 'Batch', 'Overall Score', 'Freshness', 'Appearance', 'Decision', 'Inspector', 'Timestamp'];
        rows = inspections.map((i) => [
          i.id,
          `"${i.productName}"`,
          i.batchNumber,
          i.overallScore,
          i.freshnessScore,
          i.appearanceScore,
          i.decision,
          `"${i.inspectorName}"`,
          i.inspectedAt,
        ]);
        break;

      case 'DELIVERY':
        headers = ['Delivery ID', 'Order Number', 'Rider', 'Customer', 'Destination', 'Distance (km)', 'Status', 'Risk Level'];
        rows = deliveries.map((d) => [
          d.id,
          d.orderNumber,
          `"${d.riderName}"`,
          `"${d.customerName}"`,
          `"${d.destinationArea}"`,
          d.distanceKm,
          d.status,
          d.riskLevel,
        ]);
        break;

      case 'DEFECTS':
        headers = ['Inspection ID', 'Product', 'Defect Type', 'Severity', 'Confidence', 'Description'];
        rows = inspections.flatMap((i) =>
          i.defects.map((def) => [
            i.id,
            `"${i.productName}"`,
            def.type,
            def.severity,
            def.confidence,
            `"${def.locationDescription}"`,
          ])
        );
        break;

      case 'RIDERS':
        headers = ['Rider Name', 'Vehicle', 'Handling Score (%)', 'Total Deliveries', 'Successful', 'Damage Incidents', 'Avg Time (min)'];
        rows = riders.map((r) => [
          `"${r.name}"`,
          r.vehicleType,
          r.handlingScore,
          r.totalDeliveries,
          r.successfulDeliveries,
          r.damageIncidents,
          r.avgDeliveryTimeMinutes,
        ]);
        break;

      case 'FEEDBACK':
        headers = ['Order Number', 'Customer', 'Overall Rating', 'Freshness', 'Packaging', 'Damage Flagged', 'Comment'];
        rows = feedback.map((f) => [
          f.orderNumber,
          `"${f.customerName}"`,
          f.rating,
          f.freshnessRating,
          f.packagingRating,
          f.isDamageReported ? 'YES' : 'NO',
          `"${f.comment.replace(/"/g, '""')}"`,
        ]);
        break;
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" /> Executive Reports & Compliance Audits
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate printable certifications and CSV exports for food safety compliance and investor audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Printable Report
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Controls Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Report Type Selector */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <span className="text-xs text-slate-400 mr-2 font-semibold uppercase">Report:</span>
            {[
              { id: 'QUALITY', label: 'Quality & Intake' },
              { id: 'DELIVERY', label: 'Fleet Delivery' },
              { id: 'DEFECTS', label: 'Defect Analysis' },
              { id: 'RIDERS', label: 'Rider Scorecard' },
              { id: 'FEEDBACK', label: 'Customer Satisfaction' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setReportType(t.id as ReportType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  reportType === t.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="TODAY">Today&apos;s Shifts</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="ALL_TIME">All-Time Archive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Report Table Preview */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm">
              FreshGuard AI Certified {reportType} Audit
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Generated: {new Date().toLocaleString()} • Range: {dateRange}
            </p>
          </div>
          <Badge variant="emerald" dot>
            ISO-Compliant Cold Audit
          </Badge>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'QUALITY' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Freshness</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">Packaging Directive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inspections.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-white">{i.productName}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{i.batchNumber}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {i.overallScore}/100
                    </td>
                    <td className="py-3 px-4 font-mono">{i.freshnessScore}%</td>
                    <td className="py-3 px-4">
                      <Badge variant={i.decision === 'APPROVED' ? 'emerald' : 'rose'}>
                        {i.decision}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{i.inspectorName}</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">
                      {i.packagingAdvice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'DELIVERY' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Courier Rider</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Distance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-white">{d.orderNumber}</td>
                    <td className="py-3 px-4 font-medium">{d.riderName}</td>
                    <td className="py-3 px-4">{d.customerName}</td>
                    <td className="py-3 px-4 text-slate-400">{d.destinationArea}</td>
                    <td className="py-3 px-4 font-mono">{d.distanceKm} km</td>
                    <td className="py-3 px-4">
                      <Badge variant={d.status === 'DELIVERED' ? 'emerald' : 'cyan'}>
                        {d.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={d.riskLevel === 'HIGH' ? 'rose' : 'emerald'}>
                        {d.riskLevel}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'RIDERS' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Courier</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Handling Score</th>
                  <th className="py-3 px-4">Deliveries</th>
                  <th className="py-3 px-4">Success Rate</th>
                  <th className="py-3 px-4">Damage Incidents</th>
                  <th className="py-3 px-4">Avg Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {riders.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-white">{r.name}</td>
                    <td className="py-3 px-4">{r.vehicleType}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {r.handlingScore}%
                    </td>
                    <td className="py-3 px-4 font-mono">{r.totalDeliveries}</td>
                    <td className="py-3 px-4 font-mono text-cyan-300">{r.reliabilityScore}%</td>
                    <td className="py-3 px-4 font-mono">{r.damageIncidents}</td>
                    <td className="py-3 px-4 font-mono">{r.avgDeliveryTimeMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
