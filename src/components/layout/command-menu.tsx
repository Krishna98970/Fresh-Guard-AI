'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Scan,
  PackageCheck,
  Truck,
  AlertTriangle,
  Users,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Command,
  X,
} from 'lucide-react';
import { store } from '@/lib/db/store';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Search logic across items
  const products = store.getProducts();
  const orders = store.getOrders();
  const deliveries = store.getDeliveries();
  const alerts = store.getAlerts();

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  );
  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
      o.customerName.toLowerCase().includes(query.toLowerCase())
  );
  const filteredDeliveries = deliveries.filter(
    (d) =>
      d.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
      d.riderName.toLowerCase().includes(query.toLowerCase())
  );

  const actions = [
    {
      id: 'act-insp',
      title: 'Run AI Produce Inspection',
      category: 'Quick Action',
      icon: Scan,
      url: '/dashboard/inspection',
    },
    {
      id: 'act-pack',
      title: 'Open Smart Packing Station',
      category: 'Quick Action',
      icon: PackageCheck,
      url: '/dashboard/packing',
    },
    {
      id: 'act-tel',
      title: 'Launch Virtual IoT Telemetry',
      category: 'Quick Action',
      icon: Truck,
      url: '/dashboard/telemetry',
    },
    {
      id: 'act-alt',
      title: 'View Active Alerts & Violations',
      category: 'Quick Action',
      icon: AlertTriangle,
      url: '/dashboard/alerts',
    },
  ];

  const handleSelect = (url: string) => {
    router.push(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl glass-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-emerald-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, produce, deliveries, riders, or alerts... (e.g. Apples, 881)"
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 text-[10px] font-mono bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="sm:hidden text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          {!query && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Suggested Actions
              </div>
              <div className="space-y-1">
                {actions.map((act) => (
                  <button
                    key={act.id}
                    onClick={() => handleSelect(act.url)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-800/60 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <act.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-slate-200 group-hover:text-emerald-300">
                        {act.title}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders Match */}
          {filteredOrders.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1.5 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" /> Orders ({filteredOrders.length})
              </div>
              <div className="space-y-1">
                {filteredOrders.slice(0, 4).map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => handleSelect('/dashboard/orders')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-800/60 transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-medium text-white flex items-center gap-2">
                        <span>{ord.orderNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ord.customerName} • ${ord.totalAmount}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Match */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1.5 flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" /> Produce Catalog ({filteredProducts.length})
              </div>
              <div className="space-y-1">
                {filteredProducts.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect('/dashboard/products')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-800/60 transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-medium text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        SKU: {p.sku} • Quality: {p.avgQualityScore}% • Stock: {p.stock} {p.unit}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Deliveries Match */}
          {filteredDeliveries.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" /> Dispatches & Deliveries
              </div>
              <div className="space-y-1">
                {filteredDeliveries.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect('/dashboard/deliveries')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-800/60 transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-medium text-white">Order {d.orderNumber}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Rider: {d.riderName} • {d.destinationArea} • Status: {d.status}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="font-mono bg-slate-800 px-1 rounded">↵</kbd> to select</span>
            <span><kbd className="font-mono bg-slate-800 px-1 rounded">ESC</kbd> to close</span>
          </div>
          <span className="text-emerald-400 font-mono">FreshGuard Intelligent Query Engine</span>
        </div>
      </div>
    </div>
  );
}
