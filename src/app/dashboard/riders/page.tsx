'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Award,
  ShieldCheck,
  Truck,
  TrendingUp,
  Clock,
  AlertTriangle,
  Star,
  CheckCircle2,
  Bike,
} from 'lucide-react';
import { store } from '@/lib/db/store';
import { Rider, Delivery } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export default function RidersPage() {
  const riders = store.getRiders();
  const deliveries = store.getDeliveries();

  // Dynamically compute scores from stored deliveries for each rider
  const riderStats = riders.map((rider) => {
    const riderDeliveries = deliveries.filter((d) => d.riderId === rider.id);
    const completed = riderDeliveries.filter((d) => d.status === 'DELIVERED').length;
    const incidents = riderDeliveries.reduce((sum, d) => sum + (d.recentEvents?.length || 0), 0);

    // Compute dynamic handling score from incidents
    const calculatedHandlingScore = Math.max(
      70,
      Number((rider.handlingScore - incidents * 0.8).toFixed(1))
    );

    const reliability =
      rider.totalDeliveries > 0
        ? Number(((rider.successfulDeliveries / rider.totalDeliveries) * 100).toFixed(1))
        : 99.0;

    return {
      ...rider,
      liveDeliveriesCount: riderDeliveries.length,
      calculatedHandlingScore,
      reliability,
      totalIncidents: rider.damageIncidents + incidents,
    };
  }).sort((a, b) => b.calculatedHandlingScore - a.calculatedHandlingScore);

  const getVehicleIcon = (type: Rider['vehicleType']) => {
    switch (type) {
      case 'E_BIKE':
        return <Bike className="w-3.5 h-3.5 text-emerald-400" />;
      case 'MOTORBIKE':
        return <Bike className="w-3.5 h-3.5 text-amber-400" />;
      case 'VAN':
        return <Truck className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" /> Courier Fleet & Handling Performance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic rider scoring calculated from transit telemetry, vibration incidents, and damage complaints
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan">Fleet Active: {riders.length} Couriers</Badge>
          <Badge variant="emerald">Avg Handling: 96.8%</Badge>
        </div>
      </div>

      {/* Fleet Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Top Performer</div>
          <div className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> {riderStats[0]?.name}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-mono font-semibold">
            {riderStats[0]?.calculatedHandlingScore}% Handling Score
          </p>
        </Card>

        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Average Dispatch Speed</div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">17.8 min</div>
          <p className="text-[11px] text-cyan-400 mt-1">Order to doorstep</p>
        </Card>

        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Zero-Damage Deliveries</div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">99.4%</div>
          <p className="text-[11px] text-emerald-400 mt-1">Produce integrity maintained</p>
        </Card>

        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Total Deliveries Logged</div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">1,312</div>
          <p className="text-[11px] text-slate-400 mt-1">Across all city zones</p>
        </Card>
      </div>

      {/* Rider Leaderboards & Detailed Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Courier Leaderboard & Telemetry Performance
        </h3>

        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rank & Courier</th>
                  <th className="py-3 px-4 font-semibold">Vehicle & Zone</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Handling Score</th>
                  <th className="py-3 px-4 font-semibold">Reliability</th>
                  <th className="py-3 px-4 font-semibold">Avg Transit Time</th>
                  <th className="py-3 px-4 font-semibold">Damage Incidents</th>
                  <th className="py-3 px-4 font-semibold text-right">Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {riderStats.map((rider, index) => (
                  <tr key={rider.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="w-5 font-mono font-bold text-slate-500">
                          #{index + 1}
                        </span>
                        <img
                          src={rider.avatarUrl}
                          alt={rider.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-semibold text-white">{rider.name}</div>
                          <div className="text-[11px] text-slate-400">{rider.phone}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        {getVehicleIcon(rider.vehicleType)}
                        <span>{rider.vehicleType.replace('_', ' ')}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{rider.zone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          rider.status === 'ON_DELIVERY'
                            ? 'cyan'
                            : rider.status === 'AVAILABLE'
                            ? 'emerald'
                            : 'slate'
                        }
                        dot={rider.status === 'ON_DELIVERY'}
                      >
                        {rider.status.replace('_', ' ')}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              rider.calculatedHandlingScore >= 95
                                ? 'bg-emerald-400'
                                : rider.calculatedHandlingScore >= 90
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                            style={{ width: `${rider.calculatedHandlingScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-white text-xs">
                          {rider.calculatedHandlingScore}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                      {rider.reliability}%
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {rider.avgDeliveryTimeMinutes} min
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono font-semibold ${
                          rider.totalIncidents > 1 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        {rider.totalIncidents}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/dashboard/deliveries`}>
                        <Button size="sm" variant="outline">
                          View Orders
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
