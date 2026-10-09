'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  PackageCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Box,
  Truck,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
} from 'lucide-react';
import { store } from '@/lib/db/store';
import { Order, PackingRecord, Product } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';

function PackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedOrderId = searchParams.get('orderId');

  const [orders, setOrders] = useState<Order[]>(() => store.getOrders());
  const [packingRecords, setPackingRecords] = useState<PackingRecord[]>(() =>
    store.getPackingRecords()
  );

  // Packing action modal
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedPackaging, setSelectedPackaging] = useState<
    PackingRecord['packagingType']
  >('VENTILATED_ECO_TRAY');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [damageNotes, setDamageNotes] = useState<string>('');

  const refresh = () => {
    setOrders(store.getOrders());
    setPackingRecords(store.getPackingRecords());
  };

  // Smart packaging recommender rule engine
  const getPackagingRecommendation = (order: Order) => {
    const firstItem = order.items[0];
    const category = firstItem?.category || 'FRUITS';

    if (category === 'LEAFY_GREENS' || firstItem?.productName.includes('Strawberr')) {
      return {
        type: 'VENTILATED_ECO_TRAY' as const,
        label: 'Ventilated Eco-Tray with Micro-Perforations',
        reason: 'Prevents ethylene accumulation and respiratory moisture buildup.',
        fragility: 'EXTREME' as const,
      };
    }
    if (category === 'VEGETABLES' && firstItem?.productName.includes('Tomato')) {
      return {
        type: 'CUSHIONED_AIR_CELL' as const,
        label: 'Cushioned Air-Cell Cellar Divider',
        reason: 'Absorbs transit shock waves and prevents contact compression bruising.',
        fragility: 'HIGH' as const,
      };
    }
    if (category === 'DAIRY') {
      return {
        type: 'INSULATED_THERMAL_POUCH' as const,
        label: 'Insulated Thermal Cold Pouch (<4°C)',
        reason: 'Mandatory cold-chain maintenance for perishable dairy items.',
        fragility: 'HIGH' as const,
      };
    }
    if (category === 'FRUITS' && firstItem?.productName.includes('Avocado')) {
      return {
        type: 'RIGID_CLAMSHELL' as const,
        label: 'Rigid Shock-Absorbing Clamshell',
        reason: 'Protects delicate ripe fruit skins from vehicle deceleration impact.',
        fragility: 'HIGH' as const,
      };
    }
    return {
      type: 'STANDARD_CORRUGATED' as const,
      label: 'Reinforced Corrugated Produce Box',
      reason: 'Standard sturdy container for hardy fruits, bakery, or root produce.',
      fragility: 'LOW' as const,
    };
  };

  const handleOpenPackModal = (order: Order) => {
    setActiveOrder(order);
    const rec = getPackagingRecommendation(order);
    setSelectedPackaging(rec.type);
    setSpecialInstructions(rec.reason);
    setIsPackModalOpen(true);
  };

  const handleOpenFlagModal = (order: Order) => {
    setActiveOrder(order);
    setDamageNotes('Crushed during staging at pack station.');
    setIsFlagModalOpen(true);
  };

  const handleConfirmPack = () => {
    if (!activeOrder) return;
    const rec = getPackagingRecommendation(activeOrder);

    store.createPackingRecord({
      orderId: activeOrder.id,
      orderNumber: activeOrder.orderNumber,
      packerId: 'usr-packer-01',
      packerName: 'Elena Rostova',
      packagingType: selectedPackaging,
      fragilityLevel: rec.fragility,
      specialHandlingInstructions: [specialInstructions],
      status: 'PACKED',
    });

    setIsPackModalOpen(false);
    refresh();
  };

  const handleConfirmFlagDamage = () => {
    if (!activeOrder) return;

    store.createPackingRecord({
      orderId: activeOrder.id,
      orderNumber: activeOrder.orderNumber,
      packerId: 'usr-packer-01',
      packerName: 'Elena Rostova',
      packagingType: 'STANDARD_CORRUGATED',
      fragilityLevel: 'HIGH',
      specialHandlingInstructions: ['FLAGGED FOR RETEST'],
      status: 'FLAGGED',
      damageReported: true,
      damageNotes,
    });

    store.createAlert({
      type: 'PACKING',
      severity: 'CRITICAL',
      title: `Packing Damage Flagged: Order ${activeOrder.orderNumber}`,
      message: `Packer flagged damage: "${damageNotes}". Diverted from dispatch.`,
      entityType: 'ORDER',
      entityId: activeOrder.id,
    });

    setIsFlagModalOpen(false);
    refresh();
  };

  // Filter orders relevant for packing (APPROVED, PACKING, READY)
  const packingQueueOrders = orders.filter(
    (o) =>
      o.status === 'APPROVED' ||
      o.status === 'PACKING' ||
      o.packingStatus === 'PENDING' ||
      o.packingStatus === 'IN_PROGRESS'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-emerald-400" /> Smart Packing Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated fragility classification, shock cushioning directives, and cold-bag sealing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan">
            Packing Queue: {packingQueueOrders.length} Orders
          </Badge>
          <Badge variant="emerald">
            Completed: {packingRecords.filter((r) => r.status === 'PACKED').length}
          </Badge>
        </div>
      </div>

      {/* Fragility & Packaging Knowledge Matrix Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl glass-card border border-emerald-500/20 text-xs space-y-1">
          <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5" /> Ventilated Eco-Tray
          </div>
          <p className="text-slate-400 text-[11px]">
            Berries & Leafy Greens. Controlled airflow stops condensation rot.
          </p>
        </div>

        <div className="p-3.5 rounded-xl glass-card border border-cyan-500/20 text-xs space-y-1">
          <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Cushioned Air-Cell
          </div>
          <p className="text-slate-400 text-[11px]">
            Vine Tomatoes & Peaches. Absorbs vehicle speed bump vibrations.
          </p>
        </div>

        <div className="p-3.5 rounded-xl glass-card border border-amber-500/20 text-xs space-y-1">
          <div className="font-semibold text-amber-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Rigid Clamshell
          </div>
          <p className="text-slate-400 text-[11px]">
            Avocados & Soft Fruits. Stiff enclosure prevents lateral crushing.
          </p>
        </div>

        <div className="p-3.5 rounded-xl glass-card border border-blue-500/20 text-xs space-y-1">
          <div className="font-semibold text-blue-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Insulated Cold Pouch
          </div>
          <p className="text-slate-400 text-[11px]">
            Dairy & Cut Produce. Reflective lining keeps core temperature &lt;4°C.
          </p>
        </div>
      </div>

      {/* Main Packing Queue */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Staging & Packing Queue
        </h3>

        {packingQueueOrders.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="All approved orders packed"
            description="The packing queue is clear. New orders will appear here automatically as soon as AI Quality Inspection approves them."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packingQueueOrders.map((order) => {
              const rec = getPackagingRecommendation(order);
              const isPacked = order.packingStatus === 'PACKED';

              return (
                <Card
                  key={order.id}
                  className={`flex flex-col justify-between ${
                    preselectedOrderId === order.id ? 'border-emerald-500 ring-1 ring-emerald-500' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-mono font-bold text-white">
                          {order.orderNumber}
                        </span>
                        <div className="text-[11px] text-slate-400">{order.customerName}</div>
                      </div>
                      <Badge
                        variant={
                          order.packingStatus === 'PACKED'
                            ? 'emerald'
                            : order.packingStatus === 'FLAGGED'
                            ? 'rose'
                            : 'amber'
                        }
                      >
                        {order.packingStatus}
                      </Badge>
                    </div>

                    {/* Produce items list */}
                    <div className="py-3 space-y-2 text-xs">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60"
                        >
                          <span className="font-medium text-white">{item.productName}</span>
                          <span className="font-mono text-slate-400">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* AI Packaging Recommendation */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-xs space-y-1 my-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-400">
                          Recommended Packaging
                        </span>
                        <Badge
                          variant={rec.fragility === 'EXTREME' ? 'rose' : 'amber'}
                          className="text-[9px] py-0"
                        >
                          Fragility: {rec.fragility}
                        </Badge>
                      </div>
                      <div className="font-semibold text-white">{rec.label}</div>
                      <p className="text-[11px] text-slate-400 leading-tight">{rec.reason}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenFlagModal(order)}
                      icon={<AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                    >
                      Flag Damage
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenPackModal(order)}
                      icon={<PackageCheck className="w-3.5 h-3.5" />}
                    >
                      {isPacked ? 'Repack Order' : 'Pack Order'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Packing History Table */}
      <div className="pt-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Recent Packing Logs ({packingRecords.length})
        </h3>

        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Packer</th>
                  <th className="py-3 px-4 font-semibold">Packaging Type</th>
                  <th className="py-3 px-4 font-semibold">Fragility</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Instructions</th>
                  <th className="py-3 px-4 font-semibold text-right">Delivery Handoff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {packingRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{rec.orderNumber}</td>
                    <td className="py-3 px-4">{rec.packerName}</td>
                    <td className="py-3 px-4 font-medium text-emerald-300">
                      {rec.packagingType.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={rec.fragilityLevel === 'EXTREME' ? 'rose' : 'amber'}
                        className="text-[10px]"
                      >
                        {rec.fragilityLevel}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={rec.status === 'PACKED' ? 'emerald' : 'rose'}>
                        {rec.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">
                      {rec.specialHandlingInstructions?.[0] || 'Standard protocol'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/dashboard/deliveries`}>
                        <Button size="sm" variant="outline" icon={<Truck className="w-3 h-3" />}>
                          Dispatch
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

      {/* Pack Order Modal */}
      {activeOrder && (
        <Modal
          isOpen={isPackModalOpen}
          onClose={() => setIsPackModalOpen(false)}
          title={`Pack Order ${activeOrder.orderNumber}`}
          description={`Customer: ${activeOrder.customerName} • Items: ${activeOrder.items[0]?.productName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Selected Packaging Standard</label>
              <select
                value={selectedPackaging}
                onChange={(e) => setSelectedPackaging(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="VENTILATED_ECO_TRAY">
                  Ventilated Eco-Tray with Micro-Perforations (Berries/Leafy)
                </option>
                <option value="CUSHIONED_AIR_CELL">
                  Cushioned Air-Cell Cellar Divider (Tomatoes/Stonefruit)
                </option>
                <option value="RIGID_CLAMSHELL">
                  Rigid Shock-Absorbing Clamshell (Avocados/Grapes)
                </option>
                <option value="INSULATED_THERMAL_POUCH">
                  Insulated Thermal Cold Pouch &lt;4°C (Dairy/Chilled)
                </option>
                <option value="STANDARD_CORRUGATED">
                  Standard Corrugated Box (Apples/Bakery)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Special Transit Directive</label>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                Produce quality inspected and verified. Packing seals will update order status to READY.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsPackModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmPack}>
                Seal & Mark Packed
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Flag Damage Modal */}
      {activeOrder && (
        <Modal
          isOpen={isFlagModalOpen}
          onClose={() => setIsFlagModalOpen(false)}
          title={`Flag Damage: ${activeOrder.orderNumber}`}
          description="Report physical produce damage identified during packaging intake"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Damage Description / Cause</label>
              <textarea
                rows={3}
                required
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                placeholder="e.g. Broken skin observed on tomato cluster during transfer into packing tray."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>
                This will halt dispatch, set packing status to FLAGGED, and alert the intake manager.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsFlagModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmFlagDamage}>
                Submit Damage Flag
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function PackingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
          Loading Packing Intelligence...
        </div>
      }
    >
      <PackingContent />
    </React.Suspense>
  );
}
