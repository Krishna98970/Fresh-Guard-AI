'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  Scan,
  PackageCheck,
  AlertTriangle,
  ArrowRight,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';
import { store } from '@/lib/db/store';
import { Order, OrderStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(() => store.getOrders());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // New Order Form state
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('prod-005');
  const [quantity, setQuantity] = useState(2);

  const products = store.getProducts();

  const refreshList = () => {
    setOrders(store.getOrders());
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === selectedProductId) || products[0];

    store.createOrder({
      customerName,
      customerAddress,
      customerPhone,
      items: [
        {
          id: `item-${Date.now()}`,
          orderId: '',
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          category: product.category,
          quantity,
          unitPrice: 4.99,
          unit: product.unit,
        },
      ],
      status: 'INSPECTION',
    });

    refreshList();
    setIsCreateModalOpen(false);
    setCustomerName('');
    setCustomerAddress('');
    setCustomerPhone('');
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const filteredOrders = orders.filter((o) => {
    const matchQuery =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const statuses = [
    'ALL',
    'INSPECTION',
    'APPROVED',
    'PACKING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'APPROVED':
      case 'DELIVERED':
        return <Badge variant="emerald">{status}</Badge>;
      case 'INSPECTION':
      case 'PACKING':
        return <Badge variant="amber">{status}</Badge>;
      case 'OUT_FOR_DELIVERY':
      case 'READY':
        return <Badge variant="cyan">{status}</Badge>;
      case 'REJECTED':
      case 'CANCELLED':
        return <Badge variant="rose">{status}</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-400" /> Order Fulfillment Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking customer orders from automated produce intake to last-mile delivery
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create New Order
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer, address..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto py-1">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description="Try broadening your status filter or create a simulated customer order."
          actionLabel="Create Order"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Produce Items</th>
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Quality</th>
                  <th className="py-3 px-4 font-semibold">Packing</th>
                  <th className="py-3 px-4 font-semibold">Delivery</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => openDetails(ord)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {ord.orderNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{ord.customerName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {ord.customerAddress}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-white">
                        {ord.items[0]?.productName}
                        {ord.items.length > 1 && (
                          <span className="text-slate-400 text-[10px] ml-1">
                            +{ord.items.length - 1} more
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Qty: {ord.items[0]?.quantity} {ord.items[0]?.unit}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {formatCurrency(ord.totalAmount)}
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(ord.status)}</td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                          ord.qualityStatus === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : ord.qualityStatus === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {ord.qualityStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                          ord.packingStatus === 'PACKED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {ord.packingStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                          ord.deliveryStatus === 'DELIVERED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : ord.deliveryStatus === 'IN_TRANSIT'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {ord.deliveryStatus}
                      </span>
                    </td>

                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openDetails(ord)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Quick-Commerce Order"
        description="Simulate fresh produce customer order for quick-commerce intake"
        maxWidth="md"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Customer Full Name</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Maya Lin"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Delivery Address</label>
            <input
              type="text"
              required
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="145 Grand Ave, Apt 3B, Downtown"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+1 (555) 234-8901"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Select Produce</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Place Order</Button>
          </div>
        </form>
      </Modal>

      {/* Order Details Modal with Timeline */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Order ${selectedOrder.orderNumber}`}
          description={`Customer: ${selectedOrder.customerName} • Placed ${formatDate(
            selectedOrder.createdAt
          )}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Quick Status Bar */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-semibold">
                  Quality Check
                </div>
                <div className="font-bold text-emerald-400 mt-0.5">
                  {selectedOrder.qualityStatus}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-semibold">
                  Smart Packing
                </div>
                <div className="font-bold text-cyan-400 mt-0.5">
                  {selectedOrder.packingStatus}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-semibold">
                  Delivery Transit
                </div>
                <div className="font-bold text-white mt-0.5">
                  {selectedOrder.deliveryStatus}
                </div>
              </div>
            </div>

            {/* Produce Items */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Order Items & Produce
              </div>
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                  >
                    <div>
                      <div className="font-semibold text-white">{item.productName}</div>
                      <div className="text-[11px] text-slate-400">
                        SKU: {item.sku} • Qty: {item.quantity} {item.unit}
                      </div>
                    </div>
                    <div className="font-mono text-emerald-400 font-bold">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Lifecycle Progression
              </div>
              <div className="space-y-3 pl-2 border-l-2 border-slate-800 ml-2">
                <div className="relative pl-4">
                  <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div className="font-medium text-white">Order Placed & Intake Registered</div>
                  <div className="text-[11px] text-slate-400">
                    {formatDate(selectedOrder.createdAt)}
                  </div>
                </div>

                <div className="relative pl-4">
                  <span
                    className={`absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full ${
                      selectedOrder.qualityStatus !== 'PENDING' ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  />
                  <div className="font-medium text-white">
                    AI Produce Quality Inspection ({selectedOrder.qualityStatus})
                  </div>
                </div>

                <div className="relative pl-4">
                  <span
                    className={`absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full ${
                      selectedOrder.packingStatus === 'PACKED' ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  />
                  <div className="font-medium text-white">
                    Smart Fragility Packing ({selectedOrder.packingStatus})
                  </div>
                </div>

                <div className="relative pl-4">
                  <span
                    className={`absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full ${
                      selectedOrder.deliveryStatus === 'DELIVERED'
                        ? 'bg-emerald-500'
                        : selectedOrder.deliveryStatus === 'IN_TRANSIT'
                        ? 'bg-cyan-400 animate-ping'
                        : 'bg-slate-700'
                    }`}
                  />
                  <div className="font-medium text-white">
                    Delivery Dispatch & Completion ({selectedOrder.deliveryStatus})
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Workflow Links */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Link href={`/dashboard/inspection?orderId=${selectedOrder.id}`}>
                <Button size="sm" variant="primary" icon={<Scan className="w-3.5 h-3.5" />}>
                  Inspect Produce
                </Button>
              </Link>
              <Link href={`/dashboard/packing?orderId=${selectedOrder.id}`}>
                <Button size="sm" variant="secondary" icon={<PackageCheck className="w-3.5 h-3.5" />}>
                  Smart Packing
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
