'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Scan,
  ShieldCheck,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Thermometer,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '@/lib/auth/auth-context';
import { store } from '@/lib/db/store';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getQualityScoreColor, formatCurrency } from '@/lib/utils';

export default function OverviewPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const orders = store.getOrders();
  const inspections = store.getInspections();
  const deliveries = store.getDeliveries();
  const alerts = store.getAlerts().filter((a) => !a.isRead);
  const products = store.getProducts();

  // Metrics calculations
  const totalOrders = orders.length;
  const approvedInspections = inspections.filter((i) => i.decision === 'APPROVED').length;
  const rejectedInspections = inspections.filter((i) => i.decision === 'REJECTED').length;
  const activeDeliveries = deliveries.filter((d) => d.status === 'IN_TRANSIT').length;

  const avgQuality = inspections.length
    ? Math.round(
        inspections.reduce((acc, cur) => acc + cur.overallScore, 0) / inspections.length
      )
    : 92;

  // Chart data for Quality Score trends over past 7 shifts
  const qualityTrendData = [
    { shift: 'Mon AM', quality: 93, target: 85, volume: 140 },
    { shift: 'Mon PM', quality: 91, target: 85, volume: 190 },
    { shift: 'Tue AM', quality: 95, target: 85, volume: 160 },
    { shift: 'Tue PM', quality: 89, target: 85, volume: 220 },
    { shift: 'Wed AM', quality: 94, target: 85, volume: 175 },
    { shift: 'Wed PM', quality: 92, target: 85, volume: 210 },
    { shift: 'Today', quality: avgQuality, target: 85, volume: 245 },
  ];

  // Defect breakdown data
  const defectBreakdownData = [
    { category: 'Mechanical Bruise', count: 4, severity: 'LOW' },
    { category: 'Surface Cut', count: 2, severity: 'MEDIUM' },
    { category: 'Cold Damage', count: 1, severity: 'HIGH' },
    { category: 'Dehydration', count: 3, severity: 'LOW' },
  ];

  // Inspection Queue: Orders needing inspection
  const pendingInspectionOrders = orders.filter(
    (o) => o.qualityStatus === 'PENDING' || o.status === 'INSPECTION'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Greeting & System Health */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Good morning, {user?.name?.split(' ')[0] || 'Operator'}
            </h1>
            <span className="text-xl">🌿</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Here is the real-time operational overview across produce intake, AI inspection, and last-mile telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Produce Intake: 98.2% Nominal</span>
          </div>

          <Link href="/dashboard/inspection">
            <Button size="sm" icon={<Scan className="w-3.5 h-3.5" />}>
              New Inspection
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Orders Today */}
        <Card hover>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Orders Today</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{totalOrders + 48}</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +14.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Quick-commerce fulfillment pipeline</p>
        </Card>

        {/* Card 2: AI Quality Inspections */}
        <Card hover>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Quality Score</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Scan className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{avgQuality}/100</span>
            <Badge variant="emerald" dot className="text-[10px] py-0">
              Grade A
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {approvedInspections} passed • {inspections.length} total batches
          </p>
        </Card>

        {/* Card 3: Items Rejected / Damage Prevented */}
        <Card hover>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Damaged Prevented</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">99.1%</span>
            <span className="text-xs text-amber-400">{rejectedInspections} Defective Blocked</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Intercepted before packing</p>
        </Card>

        {/* Card 4: Active Deliveries */}
        <Card hover>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Dispatches</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{activeDeliveries + 2}</span>
            <span className="text-xs text-cyan-400 font-mono">16.2 min avg</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Live telemetry monitoring active</p>
        </Card>
      </div>

      {/* Main Charts & Live Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Produce Quality Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Produce Quality Index & Intake Volume</CardTitle>
              <CardDescription>
                AI grading consistency vs minimum acceptable dispatch threshold (85%)
              </CardDescription>
            </div>
            <Badge variant="cyan" dot>
              Model: Gemini 1.5 Vision
            </Badge>
          </CardHeader>

          <div className="h-64 w-full pt-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={qualityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="qualityGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="shift" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[70, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f1723',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="quality"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#qualityGlow)"
                    name="Quality Score"
                  />
                  <Area
                    type="step"
                    dataKey="target"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="none"
                    name="Threshold (85%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full bg-slate-900/40 animate-pulse rounded-xl" />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-center">
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Average Freshness</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">94.8%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Defect Escape Rate</div>
              <div className="text-base font-bold text-white mt-0.5">0.08%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Inspection Speed</div>
              <div className="text-base font-bold text-cyan-400 mt-0.5">1.2s / Batch</div>
            </div>
          </div>
        </Card>

        {/* Right 1 Col: Live Telemetry Stream Visualizer */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" /> Virtual IoT Telemetry
                </CardTitle>
                <CardDescription>Live sensor stream for active dispatch FG-2026-881</CardDescription>
              </div>
              <Badge variant="cyan" dot>
                Streaming
              </Badge>
            </CardHeader>

            <div className="space-y-3 my-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Cold-Chain Chamber
                  </span>
                  <span className="font-mono text-cyan-300 font-semibold">3.4°C (Target: 1-4°C)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[45%] h-full bg-gradient-to-r from-cyan-500 to-teal-400" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Vibration G-Force
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">0.28g (Smooth)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[28%] h-full bg-emerald-500" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" /> Courier Telemetry
                  </span>
                  <span className="font-mono text-white">Alex Vance • 19.4 km/h</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Zone: Downtown Metro • ETA: 10 mins
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Physics Simulation Engine</span>
            <Link href="/dashboard/telemetry">
              <Button size="sm" variant="outline" icon={<ArrowRight className="w-3 h-3" />}>
                Full Stream
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Inspection Intake Queue & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inspection Queue */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Intake Inspection Queue
              </CardTitle>
              <CardDescription>
                Produce awaiting AI quality scan before packing clearance
              </CardDescription>
            </div>
            <Link href="/dashboard/inspection">
              <Button size="sm" variant="outline">
                View Studio
              </Button>
            </Link>
          </CardHeader>

          <div className="space-y-2">
            {pendingInspectionOrders.length > 0 ? (
              pendingInspectionOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-mono text-xs font-bold">
                      {ord.orderNumber.slice(-3)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{ord.items[0]?.productName}</div>
                      <div className="text-[11px] text-slate-400">
                        {ord.orderNumber} • {ord.items.length} items • Qty: {ord.items[0]?.quantity} {ord.items[0]?.unit}
                      </div>
                    </div>
                  </div>

                  <Link href={`/dashboard/inspection?orderId=${ord.id}`}>
                    <Button size="sm" variant="primary" icon={<Scan className="w-3 h-3" />}>
                      Inspect
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                All intake orders have completed AI quality inspection.
              </div>
            )}
          </div>
        </Card>

        {/* Recent Alerts Ticker */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Real-Time Operations Alerts
              </CardTitle>
              <CardDescription>
                Violations, cold-chain spikes, and quality anomalies
              </CardDescription>
            </div>
            <Link href="/dashboard/alerts">
              <Button size="sm" variant="outline">
                All Alerts ({alerts.length})
              </Button>
            </Link>
          </CardHeader>

          <div className="space-y-2">
            {alerts.slice(0, 3).map((alt) => (
              <div
                key={alt.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex items-start gap-3"
              >
                <div
                  className={`p-1.5 rounded-lg mt-0.5 ${
                    alt.severity === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : alt.severity === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate">{alt.title}</span>
                    <Badge variant={alt.severity === 'CRITICAL' ? 'rose' : 'amber'} className="text-[9px] py-0">
                      {alt.severity}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{alt.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
