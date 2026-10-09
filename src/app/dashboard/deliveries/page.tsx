'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  Search,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  UserCheck,
  Radio,
  Thermometer,
  Zap,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { store } from '@/lib/db/store';
import { Delivery, Rider, Order } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRelativeTime } from '@/lib/utils';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => store.getDeliveries());
  const [orders, setOrders] = useState<Order[]>(() => store.getOrders());
  const [riders, setRiders] = useState<Rider[]>(() => store.getRiders());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Dispatch Form
  const [dispatchOrderId, setDispatchOrderId] = useState('');
  const [dispatchRiderId, setDispatchRiderId] = useState('rider-01');
  const [destinationArea, setDestinationArea] = useState('Downtown Metro');

  const refresh = () => {
    setDeliveries(store.getDeliveries());
    setOrders(store.getOrders());
    setRiders(store.getRiders());
  };

  const activeDeliveries = deliveries.filter((d) => d.status === 'IN_TRANSIT');
  const deliveredToday = deliveries.filter((d) => d.status === 'DELIVERED');
  const atRiskDeliveries = deliveries.filter(
    (d) => d.status === 'IN_TRANSIT' && d.riskLevel === 'HIGH'
  );
  const readyOrders = orders.filter((o) => o.packingStatus === 'PACKED' && o.status === 'READY');

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find((o) => o.id === dispatchOrderId);
    const rider = riders.find((r) => r.id === dispatchRiderId);
    if (!order || !rider) return;

    store.createDelivery({
      orderId: order.id,
      orderNumber: order.orderNumber,
      riderId: rider.id,
      riderName: rider.name,
      customerName: order.customerName,
      destinationAddress: order.customerAddress,
      destinationArea,
      distanceKm: 3.5,
      status: 'IN_TRANSIT',
      riskLevel: 'LOW',
      dispatchedAt: new Date().toISOString(),
      estimatedDeliveryTime: new Date(Date.now() + 18 * 60000).toISOString(),
    });

    setIsDispatchModalOpen(false);
    refresh();
  };

  const handleCompleteDelivery = (id: string) => {
    store.completeDelivery(id);
    refresh();
  };

  const openDetails = (d: Delivery) => {
    setSelectedDelivery(d);
    setIsDetailsOpen(true);
  };

  const filtered = deliveries.filter(
    (d) =>
      d.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.riderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.destinationArea.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" /> Delivery Fleet Operations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time last-mile transit management, virtual IoT telematics, and rider dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/telemetry">
            <Button variant="secondary" icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />}>
              Live IoT Telemetry Studio
            </Button>
          </Link>
          <Button
            variant="primary"
            onClick={() => {
              if (readyOrders.length > 0) setDispatchOrderId(readyOrders[0].id);
              setIsDispatchModalOpen(true);
            }}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Dispatch Courier
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">In Transit</div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {activeDeliveries.length} Dispatches
          </div>
          <p className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse" /> Telemetry active
          </p>
        </Card>

        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">
            Ready for Dispatch
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {readyOrders.length} Packed
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">Staged in cold room</p>
        </Card>

        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">At Risk Trips</div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {atRiskDeliveries.length}
          </div>
          <p className="text-[11px] text-rose-400 mt-1">
            {atRiskDeliveries.length > 0 ? 'Handling anomaly flagged' : 'Zero elevated risks'}
          </p>
        </Card>

        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Delivered Today</div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {deliveredToday.length + 18} Orders
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">100% on-time record</p>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deliveries by order #, rider, zone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </Card>

      {/* Deliveries Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No deliveries found"
          description="Dispatch a courier to start tracking real-time transit telemetry."
          actionLabel="Dispatch Courier"
          onAction={() => setIsDispatchModalOpen(true)}
        />
      ) : (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Courier Rider</th>
                  <th className="py-3 px-4 font-semibold">Destination Zone</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Live Telematics</th>
                  <th className="py-3 px-4 font-semibold">Risk Level</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => openDetails(d)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-white group-hover:text-emerald-300">
                      {d.orderNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{d.riderName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {d.dispatchedAt ? `Dispatched ${formatRelativeTime(d.dispatchedAt)}` : 'Queued'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" /> {d.destinationArea}
                      </div>
                      <div className="text-[11px] text-slate-400">{d.distanceKm} km trip</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          d.status === 'DELIVERED'
                            ? 'emerald'
                            : d.status === 'IN_TRANSIT'
                            ? 'cyan'
                            : 'slate'
                        }
                      >
                        {d.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      {d.currentTelemetry ? (
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-cyan-300 flex items-center gap-1">
                            <Thermometer className="w-3 h-3 text-cyan-400" />
                            {d.currentTelemetry.temperatureC}°C
                          </span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            {d.currentTelemetry.vibrationG}g
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No active telemetry</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          d.riskLevel === 'HIGH'
                            ? 'rose'
                            : d.riskLevel === 'MEDIUM'
                            ? 'amber'
                            : 'emerald'
                        }
                      >
                        {d.riskLevel}
                      </Badge>
                    </td>

                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/dashboard/telemetry?deliveryId=${d.id}`}>
                          <Button size="sm" variant="outline" icon={<Activity className="w-3 h-3 text-cyan-400" />}>
                            IoT Stream
                          </Button>
                        </Link>

                        {d.status === 'IN_TRANSIT' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleCompleteDelivery(d.id)}
                            icon={<CheckCircle2 className="w-3 h-3" />}
                          >
                            Delivered
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispatch Courier Modal */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Dispatch Courier for Ready Order"
        description="Assign packed produce batch to an available rider"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDispatch} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Select Packed Order</label>
            {readyOrders.length > 0 ? (
              <select
                value={dispatchOrderId}
                onChange={(e) => setDispatchOrderId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                {readyOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.customerName} ({o.items[0]?.productName})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                No orders currently in READY status. Please inspect and pack an order first, or select from all orders.
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Assign Courier Rider</label>
            <select
              value={dispatchRiderId}
              onChange={(e) => setDispatchRiderId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.vehicleType} ({r.zone}) • Score: {r.handlingScore}%
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Destination Zone</label>
            <input
              type="text"
              required
              value={destinationArea}
              onChange={(e) => setDestinationArea(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsDispatchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={readyOrders.length === 0}>
              Confirm Dispatch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delivery Details Drawer */}
      {selectedDelivery && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Delivery ${selectedDelivery.orderNumber}`}
          description={`Rider: ${selectedDelivery.riderName} • Customer: ${selectedDelivery.customerName}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div>
                <span className="text-slate-400">Destination:</span>
                <div className="font-semibold text-white mt-0.5">
                  {selectedDelivery.destinationAddress}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Distance & Zone:</span>
                <div className="font-semibold text-white mt-0.5">
                  {selectedDelivery.distanceKm} km • {selectedDelivery.destinationArea}
                </div>
              </div>
            </div>

            {/* Telemetry Summary */}
            {selectedDelivery.currentTelemetry && (
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Telemetry Snapshot
                </div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-[10px] text-slate-400">Chamber Temp</div>
                    <div className="text-cyan-300 font-bold mt-0.5">
                      {selectedDelivery.currentTelemetry.temperatureC}°C
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-[10px] text-slate-400">Vibration</div>
                    <div className="text-amber-300 font-bold mt-0.5">
                      {selectedDelivery.currentTelemetry.vibrationG}g
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-[10px] text-slate-400">Speed</div>
                    <div className="text-white font-bold mt-0.5">
                      {selectedDelivery.currentTelemetry.speedKmh} km/h
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-[10px] text-slate-400">Handling Risk</div>
                    <div className="text-emerald-400 font-bold mt-0.5">
                      {selectedDelivery.currentTelemetry.handlingRisk}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Handling Events */}
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400 mb-2">
                Transit Impact Log ({selectedDelivery.recentEvents?.length || 0})
              </div>
              {(!selectedDelivery.recentEvents || selectedDelivery.recentEvents.length === 0) ? (
                <div className="p-3 rounded-xl bg-slate-900/60 text-slate-500 text-center">
                  No harsh handling or temperature excursions recorded. Trip is smooth.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedDelivery.recentEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/20 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-rose-300">{evt.type}</div>
                        <div className="text-[11px] text-slate-400">{evt.description}</div>
                      </div>
                      <span className="font-mono text-slate-500 text-[10px]">
                        {formatRelativeTime(evt.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Link href={`/dashboard/telemetry?deliveryId=${selectedDelivery.id}`}>
                <Button size="sm" variant="primary" icon={<Activity className="w-3.5 h-3.5" />}>
                  Open Full Oscilloscope
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
