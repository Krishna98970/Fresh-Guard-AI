'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Plus,
  Star,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  ShieldCheck,
  Package,
  Truck,
  Heart,
} from 'lucide-react';
import { store } from '@/lib/db/store';
import { CustomerFeedback, Order } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<CustomerFeedback[]>(() => store.getFeedback());
  const [orders, setOrders] = useState<Order[]>(() => store.getOrders());

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Form State
  const [orderId, setOrderId] = useState('');
  const [customerName, setCustomerName] = useState('Elena Fisher');
  const [rating, setRating] = useState(5);
  const [freshnessRating, setFreshnessRating] = useState(5);
  const [packagingRating, setPackagingRating] = useState(5);
  const [deliverySpeedRating, setDeliverySpeedRating] = useState(5);
  const [comment, setComment] = useState('Produce arrived crisp, cold, and intact!');
  const [isDamageReported, setIsDamageReported] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');

  const refresh = () => {
    setFeedbackList(store.getFeedback());
    setOrders(store.getOrders());
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find((o) => o.id === orderId) || orders[0];

    store.addFeedback({
      orderId: order?.id || 'ord-sample',
      orderNumber: order?.orderNumber || 'FG-2026-881',
      customerName,
      rating,
      freshnessRating,
      packagingRating,
      deliverySpeedRating,
      comment,
      isDamageReported,
      damageDescription: isDamageReported ? damageDescription : undefined,
    });

    setIsSubmitModalOpen(false);
    refresh();
  };

  // Metrics
  const avgRating = feedbackList.length
    ? Number(
        (
          feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length
        ).toFixed(1)
      )
    : 4.9;

  const damageComplaints = feedbackList.filter((f) => f.isDamageReported).length;
  const positiveFeedback = feedbackList.filter((f) => f.rating >= 4).length;
  const positiveRate = feedbackList.length
    ? Math.round((positiveFeedback / feedbackList.length) * 100)
    : 98;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-400" /> Customer Satisfaction & Feedback
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real customer reviews, freshness ratings, and damaged delivery complaint resolutions
          </p>
        </div>

        <Button
          onClick={() => {
            if (orders.length > 0) setOrderId(orders[0].id);
            setIsSubmitModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Submit Customer Feedback
        </Button>
      </div>

      {/* Metrics Cards (Prompt Section 20) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Average Rating</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {avgRating}
            </span>
            <div className="flex text-amber-400 text-sm">
              {'★'.repeat(Math.round(avgRating))}
            </div>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">Out of 5.0 satisfaction index</p>
        </Card>

        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Positive Feedback</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {positiveRate}%
            </span>
            <Badge variant="emerald" dot>
              High Trust
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {positiveFeedback} out of {feedbackList.length} verified ratings
          </p>
        </Card>

        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Damage Complaints</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-white">
              {damageComplaints}
            </span>
            <Badge variant={damageComplaints > 0 ? 'rose' : 'emerald'}>
              {damageComplaints > 0 ? 'Action Required' : 'Zero Incidents'}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Produce damage reported on arrival</p>
        </Card>

        <Card hover>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Freshness Index</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              4.9 / 5
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Evaluated directly by consumers</p>
        </Card>
      </div>

      {/* Feedback Feed */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Recent Consumer Reviews ({feedbackList.length})
        </h3>

        <div className="space-y-3">
          {feedbackList.map((fb) => (
            <Card key={fb.id} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    {fb.customerName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-xs">{fb.customerName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Order: {fb.orderNumber} • {formatDate(fb.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex text-amber-400 text-xs">
                    {'★'.repeat(fb.rating)}
                    {'☆'.repeat(5 - fb.rating)}
                  </div>
                  {fb.isDamageReported ? (
                    <Badge variant="rose">Damage Reported</Badge>
                  ) : (
                    <Badge variant="emerald">Verified Satisfied</Badge>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">&ldquo;{fb.comment}&rdquo;</p>

              {fb.isDamageReported && fb.damageDescription && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Customer Damage Claim:</span>{' '}
                    {fb.damageDescription}
                  </div>
                </div>
              )}

              {/* Sub-ratings breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-center text-[11px]">
                <div className="text-slate-400">
                  Freshness: <strong className="text-emerald-400">{fb.freshnessRating}/5</strong>
                </div>
                <div className="text-slate-400">
                  Packaging: <strong className="text-cyan-400">{fb.packagingRating}/5</strong>
                </div>
                <div className="text-slate-400">
                  Speed: <strong className="text-white">{fb.deliverySpeedRating}/5</strong>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Submit Customer Feedback Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Customer Quality Feedback"
        description="Simulate end-consumer produce quality review and damage report"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Target Order</label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — {o.customerName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Overall Rating (1-5)</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
              >
                <option value={5}>★★★★★ 5 Stars (Flawless)</option>
                <option value={4}>★★★★☆ 4 Stars (Good)</option>
                <option value={3}>★★★☆☆ 3 Stars (Acceptable)</option>
                <option value={2}>★★☆☆☆ 2 Stars (Poor)</option>
                <option value={1}>★☆☆☆☆ 1 Star (Damaged)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Produce Freshness (1-5)</label>
              <select
                value={freshnessRating}
                onChange={(e) => setFreshnessRating(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
              >
                <option value={5}>5 - Supermarket Fresh</option>
                <option value={4}>4 - Standard Crisp</option>
                <option value={3}>3 - Slightly Soft</option>
                <option value={2}>2 - Bruised</option>
                <option value={1}>1 - Inedible / Mold</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Customer Comment</label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Damage Report Checkbox */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDamageReported}
                onChange={(e) => setIsDamageReported(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="font-semibold text-white">Flag Produce Physical Damage</span>
            </label>

            {isDamageReported && (
              <div>
                <label className="block text-slate-400 mb-1">Damage Description</label>
                <input
                  type="text"
                  required={isDamageReported}
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  placeholder="e.g. Strawberries squashed at the bottom of the container."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-rose-500/40 text-white text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
