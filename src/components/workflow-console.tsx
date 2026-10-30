'use client';

import Link from 'next/link';
import { FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Activity, AlertTriangle, Check, CheckCircle2, CircleDot, MapPin, PackageCheck, Play, Plus, Thermometer, Truck, UserRound, Zap } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  acknowledgeLifecycleAlert,
  addDemoLocation,
  addDemoTemperature,
  addDemoTransitEvent,
  createDispatch,
  createOrder,
  createRider,
  fetchAnalytics,
  fetchCustomerTracking,
  fetchDeliveryHistory,
  fetchDispatches,
  fetchEligibleDispatchOrders,
  fetchLifecycleAlerts,
  fetchOrders,
  fetchPacking,
  fetchRiderPerformance,
  fetchRiders,
  fetchReportSummary,
  fetchTemperatureThresholds,
  resolveLifecycleAlert,
  saveTemperatureThresholds,
  submitCustomerFeedback,
  updateDispatchStatus,
  updatePacking,
  updateRider,
  type DeliveryHistory,
  type DispatchRecord,
  type LifecycleAlert,
  type ProduceOrder,
  type RiderPerformance,
  type WarehouseRider,
} from '@/lib/workflow-api';
import { getDashboardMetrics, type DashboardMetrics } from '@/lib/api';

const panel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const input = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50';

function subscribeToLocation(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function getDispatchIdFromLocation() {
  return new URLSearchParams(window.location.search).get('dispatchId') || '';
}

function getTrackingTokenFromLocation() {
  return new URLSearchParams(window.location.search).get('token') || '';
}

function getCurrentUserRole() {
  const session = localStorage.getItem('freshguard_auth_user');
  if (!session) return '';
  try {
    const user = JSON.parse(session) as { role?: unknown };
    return typeof user.role === 'string' ? user.role : '';
  } catch {
    return '';
  }
}

function useResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await loader());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The request could not be completed.');
    } finally {
      setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    let active = true;
    loader()
      .then((result) => { if (active) setData(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'The request could not be completed.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loader]);
  return { data, setData, loading, error, refresh };
}

function PageTitle({ eyebrow, title, description, icon: Icon }: { eyebrow: string; title: string; description: string; icon: typeof PackageCheck }) {
  return <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div><p className="mb-1 text-sm font-semibold text-emerald-700">{eyebrow}</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div>
    <Icon className="hidden h-8 w-8 text-emerald-600 sm:block" />
  </header>;
}

function Feedback({ error, loading, empty, children }: { error: string; loading: boolean; empty?: string; children?: ReactNode }) {
  return <>{error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{loading && <p className="mb-4 text-sm text-slate-500">Loading saved records…</p>}{children}{empty && !loading && <p className="p-8 text-center text-sm text-slate-500">{empty}</p>}</>;
}

function asOrderStatus(order: ProduceOrder) {
  if (order.dispatch_status === 'DELIVERED') return 'DELIVERED';
  if (order.dispatch_status === 'FAILED' || order.dispatch_status === 'CANCELLED') return order.dispatch_status;
  if (['ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'DELAYED'].includes(order.dispatch_status)) return order.dispatch_status;
  if (order.packing_status === 'COMPLETED') return 'READY FOR DISPATCH';
  if (order.inspection_decision) return `INSPECTION ${order.inspection_decision}`;
  return 'AWAITING INSPECTION';
}

export function OrdersConsole() {
  const { data: orders, loading, error, refresh } = useResource(fetchOrders);
  const currentRole = useSyncExternalStore(subscribeToLocation, getCurrentUserRole, () => '');
  const canCreateOrder = currentRole !== 'DISPATCH_MANAGER';
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [createError, setCreateError] = useState('');
  const [createdTrackingId, setCreatedTrackingId] = useState('');
  const [formBusy, setFormBusy] = useState(false);
  const filtered = (orders || []).filter((order) => `${order.order_number} ${order.customer_name} ${order.customer_address} ${asOrderStatus(order)}`.toLowerCase().includes(search.toLowerCase()));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setFormBusy(true);
    setCreateError('');
    try {
      const created = await createOrder({
        customer_name: String(values.get('customer_name')).trim(),
        customer_address: String(values.get('customer_address')).trim(),
        customer_phone: String(values.get('customer_phone')).trim() || undefined,
        priority: String(values.get('priority')),
        items: [{
          product_name: String(values.get('product_name')).trim(),
          category: String(values.get('category')),
          quantity: Number(values.get('quantity')),
          unit: String(values.get('unit')),
        }],
      });
      setCreatedTrackingId(created.tracking_id || '');
      setNotice(`Order ${created.order_number} saved. Copy its customer tracking token before leaving this page.`);
      form.reset();
      await refresh();
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : 'Order could not be created.');
    } finally {
      setFormBusy(false);
    }
  };
  return <div>
    <PageTitle eyebrow="Operations" title="Order pipeline" description="Create orders and follow their persisted inspection, packing and dispatch states." icon={Truck} />
    {notice && <div className={`${panel} mb-4 text-sm text-emerald-800`}><CheckCircle2 className="mr-2 inline h-4 w-4" />{notice}{createdTrackingId && <p className="mt-2 break-all font-mono text-xs">Customer tracking token: {createdTrackingId} <Link className="ml-2 font-sans font-bold underline" href={`/track?token=${encodeURIComponent(createdTrackingId)}`}>Open tracking portal</Link></p>}</div>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
      <section className={panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Saved orders ({orders?.length ?? 0})</h2><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer or status" className={`${input} w-full sm:w-72`} /></div>
        <Feedback error={error} loading={loading} empty={!filtered.length ? 'No orders match. Create the first order to start the lifecycle.' : undefined}>
          <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="text-xs uppercase text-slate-400"><tr>{['Order', 'Customer / Items', 'Inspection', 'Packing', 'Status', 'Next action'].map((head) => <th key={head} className="border-b px-3 py-3">{head}</th>)}</tr></thead><tbody>
            {filtered.map((order) => <tr key={order.order_id} className="border-b border-slate-100 align-top">
              <td className="px-3 py-4 font-mono font-semibold">{order.order_number}<small className="mt-1 block font-sans text-slate-400">{order.order_id.slice(0, 8)}</small></td>
              <td className="px-3 py-4"><strong>{order.customer_name}</strong><small className="block text-slate-500">{order.items.map((item) => `${item.product_name} · ${item.quantity} ${item.unit}`).join(', ')}</small></td>
              <td className="px-3 py-4">{order.inspection_decision || order.inspection_status}</td><td className="px-3 py-4">{order.packing_status}</td><td className="px-3 py-4">{asOrderStatus(order)}</td>
              <td className="px-3 py-4">{currentRole === 'DISPATCH_MANAGER' ? order.dispatch_id || order.packing_status === 'COMPLETED' ? <Link className="text-sm font-bold text-emerald-700" href="/dashboard/deliveries">Open deliveries</Link> : <span className="text-slate-500">Waiting for warehouse inspection and packing</span> : order.inspection_status === 'PENDING' ? <Link className="text-sm font-bold text-emerald-700" href={`/inspect?orderId=${encodeURIComponent(order.order_id)}`}>Inspect order</Link> : order.packing_status !== 'COMPLETED' && order.inspection_decision !== 'REJECT' ? <Link className="text-sm font-bold text-emerald-700" href="/dashboard/packing">Pack</Link> : order.dispatch_id ? <Link className="text-sm font-bold text-emerald-700" href="/dashboard/deliveries">Dispatch details</Link> : <span className="text-slate-400">—</span>}</td>
            </tr>)}
          </tbody></table></div>
        </Feedback>
      </section>
      {canCreateOrder && <section className={panel}>
        <h2 className="mb-1 font-bold">Create order</h2><p className="mb-4 text-xs text-slate-500">New orders start as awaiting inspection. Tracking tokens are shown only on creation.</p>
        {createError && <p role="alert" className="mb-3 text-sm text-rose-700">{createError}</p>}
        <form onSubmit={submit} className="grid gap-3">
          <input required name="customer_name" maxLength={120} placeholder="Customer name" className={input} />
          <input required name="customer_address" maxLength={500} placeholder="Delivery address" className={input} />
          <input name="customer_phone" maxLength={40} placeholder="Contact phone (optional)" className={input} />
          <div className="grid grid-cols-2 gap-3"><input required name="product_name" maxLength={120} placeholder="Produce item" className={input} /><select name="category" className={input}><option>FRUITS</option><option>VEGETABLES</option><option>LEAFY_GREENS</option><option>BERRIES</option></select></div>
          <div className="grid grid-cols-3 gap-3"><input required name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" className={input} /><select name="unit" className={input}><option>kg</option><option>boxes</option><option>units</option></select><select name="priority" className={input}><option>NORMAL</option><option>LOW</option><option>HIGH</option><option>URGENT</option></select></div>
          <button disabled={formBusy} className={primary}><Plus size={16} />{formBusy ? 'Saving…' : 'Save order'}</button>
        </form>
      </section>}
    </div>
  </div>;
}

export function PackingConsole() {
  const { data: orders, loading, error, refresh: refreshOrders } = useResource(fetchOrders);
  const { data: records, refresh: refreshRecords } = useResource(fetchPacking);
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const actionable = (orders || []).filter((order) => order.inspection_decision === 'ACCEPT' || order.inspection_decision === 'REVIEW' && order.dispatch_status === 'NOT_DISPATCHED' && (records || []).some((record) => record.order_id === order.order_id));
  const startOrComplete = async (order: ProduceOrder, complete: boolean) => {
    const record = records?.find((item) => item.order_id === order.order_id);
    const checklist = complete
      ? ['Product condition checked', 'Packaging secured', 'Label and destination verified'].filter((_, index) => checks[`${order.order_id}-${index}`])
      : [];
    if (complete && !checklist.length) {
      setActionError('Select at least one packing checklist item before completing.');
      return;
    }
    setBusy(order.order_id);
    setActionError('');
    try {
      await updatePacking(order.order_id, {
        status: complete ? 'COMPLETED' : 'IN_PROGRESS',
        packaging_type: record?.recommendation?.packaging_type,
        checklist,
      });
      await Promise.all([refreshOrders(), refreshRecords()]);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Packing update failed.');
    } finally {
      setBusy('');
    }
  };
  return <div>
    <PageTitle eyebrow="Warehouse" title="Smart packing" description="Recommendations are deterministic rules, not model predictions. Complete a packing checklist before dispatch." icon={PackageCheck} />
    {actionError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>}
    <Feedback error={error} loading={loading} empty={!actionable.length ? 'No accepted orders are waiting for packing.' : undefined}>
      <div className="grid gap-4 xl:grid-cols-2">{actionable.map((order) => {
        const record = records?.find((item) => item.order_id === order.order_id);
        const started = order.packing_status === 'IN_PROGRESS';
        const done = order.packing_status === 'COMPLETED';
        const items = ['Product condition checked', 'Packaging secured', 'Label and destination verified'];
        return <article key={order.order_id} className={panel}>
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-slate-400">{order.order_number}</p><h2 className="mt-1 font-bold">{order.items.map((item) => item.product_name).join(', ')}</h2><p className="text-sm text-slate-500">Inspection: {order.inspection_decision} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} {order.items[0]?.unit}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{order.packing_status}</span></div>
          {record?.recommendation && <div className="mt-4 rounded-xl bg-emerald-50 p-3"><strong className="text-sm text-emerald-900">Rule recommendation: {record.recommendation.packaging_type}</strong><p className="mt-1 text-xs text-emerald-800">{record.recommendation.reason}</p></div>}
          <div className="mt-4 space-y-2">{items.map((item, index) => <label key={item} className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" disabled={done} checked={Boolean(checks[`${order.order_id}-${index}`])} onChange={(event) => setChecks((current) => ({ ...current, [`${order.order_id}-${index}`]: event.target.checked }))} />{item}</label>)}</div>
          <button disabled={done || busy === order.order_id} onClick={() => void startOrComplete(order, started)} className={`${done ? secondary : primary} mt-5 w-full`}>{busy === order.order_id ? 'Saving…' : done ? 'Packing completed' : started ? 'Complete packing' : 'Start packing'}</button>
        </article>;
      })}</div>
    </Feedback>
    {records && records.some((record) => record.status === 'COMPLETED') && <p className="mt-5 text-xs text-slate-500">Completed packing records are saved in MongoDB and are eligible for dispatch after inspection clearance.</p>}
  </div>;
}

export function RidersConsole() {
  const { data: riders, loading, error, refresh } = useResource(fetchRiders);
  const { data: dispatches } = useResource(fetchDispatches);
  const [performances, setPerformances] = useState<Record<string, RiderPerformance>>({});
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);
  useEffect(() => {
    if (!riders?.length) return;
    let active = true;
    Promise.all(riders.map(async (rider) => [rider.rider_id, await fetchRiderPerformance(rider.rider_id)] as const))
      .then((entries) => { if (active) setPerformances(Object.fromEntries(entries)); })
      .catch((cause: unknown) => { if (active) setActionError(cause instanceof Error ? cause.message : 'Rider stats could not be loaded.'); });
    return () => { active = false; };
  }, [riders, reloadCounter]);
  const activeWorkload = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const delivery of dispatches || []) if (['ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'DELAYED'].includes(delivery.status)) counts[delivery.rider_id] = (counts[delivery.rider_id] || 0) + 1;
    return counts;
  }, [dispatches]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setActionError('');
    try {
      await createRider({ name: String(data.get('name')).trim(), phone: String(data.get('phone')).trim(), employee_id: String(data.get('employee_id')).trim() || undefined });
      form.reset();
      setOpenForm(false);
      setReloadCounter((value) => value + 1);
      await refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Rider could not be created.');
    }
  };
  const toggleRider = async (rider: WarehouseRider) => {
    setBusy(rider.rider_id);
    setActionError('');
    try {
      await updateRider(rider.rider_id, { availability: rider.availability === 'OFFLINE' ? 'AVAILABLE' : 'OFFLINE' });
      await refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Rider status update failed.');
    } finally {
      setBusy('');
    }
  };
  return <div>
    <PageTitle eyebrow="Fleet operations" title="Rider management" description="Workload and performance are calculated from stored dispatches and transit records." icon={UserRound} />
    <div className={`${panel} mb-5 flex flex-wrap items-center justify-between gap-3`}><p className="text-sm text-slate-600">Available riders: <strong>{riders?.filter((item) => item.availability === 'AVAILABLE').length ?? 0}</strong> · Active deliveries: <strong>{Object.values(activeWorkload).reduce((a, b) => a + b, 0)}</strong></p><button className={primary} onClick={() => setOpenForm((value) => !value)}><Plus size={16} />Add rider</button></div>
    {openForm && <form onSubmit={submit} className={`${panel} mb-5 grid gap-3 sm:grid-cols-4`}><input required name="name" maxLength={120} placeholder="Rider name" className={input} /><input required name="phone" maxLength={40} placeholder="Contact phone" className={input} /><input name="employee_id" maxLength={80} placeholder="Linked rider login (optional)" className={input} /><button className={primary}>Save rider</button></form>}
    {actionError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>}
    <Feedback error={error} loading={loading} empty={!riders?.length ? 'No riders have been added to this warehouse.' : undefined}>
      <div className="grid gap-4 lg:grid-cols-2">{(riders || []).map((rider) => {
        const stats = performances[rider.rider_id];
        return <article key={rider.rider_id} className={panel}>
          <div className="flex items-start justify-between"><div><h2 className="font-bold">{rider.name}</h2><p className="mt-1 text-sm text-slate-500">{rider.rider_id} · {rider.phone}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${rider.availability === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : rider.availability === 'ON_DELIVERY' ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-600'}`}>{rider.availability}</span></div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{[
            ['Workload', activeWorkload[rider.rider_id] || 0],
            ['Completed', stats?.completed_deliveries ?? '—'],
            ['Failed', stats?.failed_deliveries ?? '—'],
            ['Handling', stats?.handling_score == null ? 'No data' : `${stats.handling_score}/100`],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><small className="block text-slate-500">{label}</small><strong>{value}</strong></div>)}</div>
          <p className="mt-3 text-xs text-slate-400">Average delivery: {stats?.average_delivery_minutes == null ? 'No completed timing data' : `${stats.average_delivery_minutes} min`}{stats?.handling_score_rule ? ` · ${stats.handling_score_rule}` : ''}</p>
          <button disabled={busy === rider.rider_id || rider.availability === 'ON_DELIVERY'} onClick={() => void toggleRider(rider)} className={`${secondary} mt-4`}>{busy === rider.rider_id ? 'Saving…' : rider.availability === 'OFFLINE' ? 'Set available' : 'Set offline'}</button>
        </article>;
      })}</div>
    </Feedback>
  </div>;
}

export function DeliveriesConsole() {
  const { data: dispatches, loading, error, refresh } = useResource(fetchDispatches);
  const { data: eligible, refresh: refreshEligible } = useResource(fetchEligibleDispatchOrders);
  const { data: riders, refresh: refreshRiders } = useResource(fetchRiders);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const currentRole = useSyncExternalStore(subscribeToLocation, getCurrentUserRole, () => '');
  const canManageDispatch = currentRole === 'ADMIN' || currentRole === 'DISPATCH_MANAGER';
  const canUpdateDispatch = canManageDispatch || currentRole === 'RIDER';
  const availableRiders = (riders || []).filter((rider) => rider.availability === 'AVAILABLE');
  const filtered = (dispatches || []).filter((item) => statusFilter === 'ALL' || item.status === statusFilter);
  const dispatchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setActionError('');
    try {
      await createDispatch({
        order_id: String(values.get('order_id')),
        rider_id: String(values.get('rider_id')),
        route: String(values.get('route')).trim() || undefined,
        priority: String(values.get('priority')),
        expected_delivery_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
      await Promise.all([refresh(), refreshEligible(), refreshRiders()]);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Dispatch could not be created.');
    }
  };
  const changeStatus = async (dispatch: DispatchRecord, next: string) => {
    setBusy(dispatch.dispatch_id);
    setActionError('');
    try {
      await updateDispatchStatus(dispatch.dispatch_id, next);
      await Promise.all([refresh(), refreshEligible(), refreshRiders()]);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Delivery status could not be updated.');
    } finally {
      setBusy('');
    }
  };
  return <div>
    <PageTitle eyebrow="Dispatch desk" title="Dispatch and deliveries" description="Dispatch uses only accepted or authorized-review orders with completed packing and an available rider." icon={Truck} />
    {actionError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>}
    {!canManageDispatch && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">You’re signed in as {currentRole ? currentRole.replaceAll('_', ' ').toLowerCase() : 'a user without a dispatch role'}. Rider assignment requires a Dispatch Manager or Admin account. Sign out and sign in with an authorized account to create dispatches.</p>}
    <section className={`${panel} mb-5`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-bold">Ready for dispatch ({eligible?.length ?? 0})</h2><p className="mt-1 text-xs text-slate-500">Orders appear here after an ACCEPT inspection and completed packing. Assign a rider below to create a delivery record.</p></div>
        <button type="button" onClick={() => void refreshEligible()} disabled={loading} className={secondary}>Refresh queue</button>
      </div>
      {eligible?.length ? <div className="divide-y divide-slate-100">{eligible.map((order) => <div key={order.order_id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <div><strong>{order.order_number}</strong><span className="ml-2 text-slate-600">{order.items.map((item) => `${item.product_name} · ${item.quantity} ${item.unit}`).join(', ')}</span><p className="mt-1 text-xs text-slate-500">Inspection {order.inspection_decision} · Packing {order.packing_status} · Priority {order.priority}</p></div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Awaiting rider assignment</span>
      </div>)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{loading ? 'Checking orders…' : 'No orders are ready yet. An order must have an ACCEPT inspection and completed packing before it enters this queue.'}</p>}
    </section>
    <section className={`${panel} mb-5`}>
      <h2 className="mb-4 font-bold">Create dispatch</h2>
      {!canManageDispatch ? <p className="text-sm text-slate-500">Only Dispatch Manager and Admin roles can assign riders. The eligible queue remains visible to warehouse staff.</p> : !eligible?.length ? <p className="text-sm text-slate-500">No eligible orders. Complete inspection and packing first.</p> : !availableRiders.length ? <p className="text-sm text-amber-700">No rider is currently available. Add or reactivate a rider first.</p> : <form onSubmit={dispatchSubmit} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <select required name="order_id" className={input}>{eligible.map((order) => <option key={order.order_id} value={order.order_id}>{order.order_number} · {order.items.map((item) => item.product_name).join(', ')}</option>)}</select>
        <select required name="rider_id" className={input}>{availableRiders.map((rider) => <option key={rider.rider_id} value={rider.rider_id}>{rider.name} · {rider.rider_id}</option>)}</select>
        <input name="route" placeholder="Route / destination" className={input} />
        <div className="flex gap-2"><select name="priority" className={`${input} min-w-0 flex-1`}><option>NORMAL</option><option>LOW</option><option>HIGH</option><option>URGENT</option></select><button className={primary}>Assign</button></div>
      </form>}
    </section>
    <section className={panel}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Dispatch records</h2><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={input}>{['ALL', 'ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'DELAYED', 'DELIVERED', 'FAILED', 'CANCELLED'].map((status) => <option key={status}>{status}</option>)}</select></div>
      <Feedback error={error} loading={loading} empty={!filtered.length ? 'No dispatch records match.' : undefined}>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="text-xs uppercase text-slate-400"><tr>{['Dispatch', 'Order', 'Rider', 'Status', 'ETA', 'Integrity', 'Actions'].map((title) => <th key={title} className="border-b px-3 py-3">{title}</th>)}</tr></thead><tbody>{filtered.map((dispatch) => <tr key={dispatch.dispatch_id} className="border-b border-slate-100">
          <td className="px-3 py-4 font-mono">{dispatch.dispatch_id}</td><td className="px-3 py-4">{dispatch.order_number}</td><td className="px-3 py-4">{dispatch.rider_name}</td><td className="px-3 py-4">{dispatch.status}</td><td className="px-3 py-4">{dispatch.expected_delivery_at ? new Date(dispatch.expected_delivery_at).toLocaleString() : '—'}</td><td className="px-3 py-4">{dispatch.integrity_score == null ? 'No events' : `${dispatch.integrity_score}/100`}</td>
          <td className="px-3 py-4"><div className="flex flex-wrap gap-2">
            {canUpdateDispatch && dispatch.status === 'ASSIGNED' && <button disabled={busy === dispatch.dispatch_id} onClick={() => void changeStatus(dispatch, 'DISPATCHED')} className={`${secondary} px-2 py-1`}>Dispatch</button>}
            {canUpdateDispatch && ['DISPATCHED', 'DELAYED'].includes(dispatch.status) && <button disabled={busy === dispatch.dispatch_id} onClick={() => void changeStatus(dispatch, 'IN_TRANSIT')} className={`${secondary} px-2 py-1`}>In transit</button>}
            {canUpdateDispatch && ['DISPATCHED', 'IN_TRANSIT'].includes(dispatch.status) && <button disabled={busy === dispatch.dispatch_id} onClick={() => void changeStatus(dispatch, 'DELAYED')} className={`${secondary} px-2 py-1`}>Delay</button>}
            {canUpdateDispatch && ['IN_TRANSIT', 'DELAYED'].includes(dispatch.status) && <button disabled={busy === dispatch.dispatch_id} onClick={() => void changeStatus(dispatch, 'DELIVERED')} className={`${primary} px-2 py-1`}>Complete</button>}
            {['IN_TRANSIT', 'DELAYED'].includes(dispatch.status) && <Link className={`${secondary} px-2 py-1`} href={`/dashboard/telemetry?dispatchId=${encodeURIComponent(dispatch.dispatch_id)}`}>Monitor</Link>}
          </div></td>
        </tr>)}</tbody></table></div>
      </Feedback>
    </section>
  </div>;
}

export function TelemetryConsole() {
  const { data: dispatches, loading, error, refresh } = useResource(fetchDispatches);
  const activeDispatches = (dispatches || []).filter((item) => ['DISPATCHED', 'IN_TRANSIT', 'DELAYED'].includes(item.status));
  const [selectedId, setSelectedId] = useState('');
  const [history, setHistory] = useState<DeliveryHistory | null>(null);
  const [running, setRunning] = useState(false);
  const [actionError, setActionError] = useState('');
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestedDispatchId = useSyncExternalStore(subscribeToLocation, getDispatchIdFromLocation, () => '');
  const selected = activeDispatches.find((dispatch) => dispatch.dispatch_id === selectedId)
    || activeDispatches.find((dispatch) => dispatch.dispatch_id === requestedDispatchId)
    || activeDispatches[0];
  const selectedIdCurrent = selected?.dispatch_id || '';
  useEffect(() => {
    let active = true;
    if (!selectedIdCurrent) return () => { active = false; };
    fetchDeliveryHistory(selectedIdCurrent)
      .then((result) => { if (active) setHistory(result); })
      .catch((cause: unknown) => { if (active) setActionError(cause instanceof Error ? cause.message : 'Telemetry history could not be loaded.'); });
    return () => { active = false; };
  }, [selectedIdCurrent]);
  useEffect(() => {
    if (!running || !selectedIdCurrent) return;
    let busyTick = false;
    timer.current = setInterval(() => {
      if (busyTick) return;
      busyTick = true;
      void (async () => {
        try {
          const index = Date.now() % 600;
          const latitude = 27.4924 + ((index % 40) / 10000);
          const longitude = 77.6737 + ((Math.floor(index / 4) % 40) / 10000);
          const temp = 4 + Math.sin(index / 20) * 1.5;
          await addDemoLocation(selectedIdCurrent, latitude, longitude);
          const reading = await addDemoTemperature(selectedIdCurrent, temp);
          const event = index % 4 === 0
            ? await addDemoTransitEvent(selectedIdCurrent, 'VIBRATION', 'Demonstration vehicle vibration sample', 0.3 + (index % 12) / 10)
            : null;
          setTick((current) => current + 1);
          setHistory((current) => current ? {
            ...current,
            locations: [...current.locations, { latitude, longitude, source: 'DEMO' as const, created_at: new Date().toISOString() }].slice(-100),
            temperatures: [...current.temperatures, reading].slice(-100),
            events: event ? [...current.events, event].slice(-100) : current.events,
          } : current);
        } catch (cause) {
          setActionError(cause instanceof Error ? cause.message : 'Simulation could not save a telemetry sample.');
          setRunning(false);
        } finally {
          busyTick = false;
        }
      })();
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [running, selectedIdCurrent]);
  const startSimulation = async () => {
    if (!selected) return;
    setBusy(true);
    setActionError('');
    try {
      if (selected.status === 'DISPATCHED') await updateDispatchStatus(selected.dispatch_id, 'IN_TRANSIT');
      await refresh();
      setRunning(true);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Simulation could not be started.');
    } finally {
      setBusy(false);
    }
  };
  const latestTemperature = history?.temperatures.at(-1);
  const points = history?.locations.slice(-24) || [];
  const coords = points.length ? points.map((point) => ({ x: point.longitude, y: point.latitude })) : [];
  const minX = Math.min(...coords.map((point) => point.x), 0);
  const maxX = Math.max(...coords.map((point) => point.x), 1);
  const minY = Math.min(...coords.map((point) => point.y), 0);
  const maxY = Math.max(...coords.map((point) => point.y), 1);
  const plotPoints = coords.map((point) => `${5 + ((point.x - minX) / (maxX - minX || 1)) * 90},${95 - ((point.y - minY) / (maxY - minY || 1)) * 90}`).join(' ');
  const triggerShock = async () => {
    if (!selected) return;
    setActionError('');
    try {
      const event = await addDemoTransitEvent(selected.dispatch_id, 'SHOCK', 'Operator-triggered simulated shock event', 1.8);
      setHistory((current) => current ? { ...current, events: [...current.events, event] } : current);
      await refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Event could not be recorded.');
    }
  };
  return <div>
    <PageTitle eyebrow="Transit monitoring" title="Temperature and handling" description="DEMO values are simulated, stored samples—not live GPS or sensor measurements." icon={Activity} />
    <div className={`${panel} mb-5 flex flex-wrap items-center gap-3`}>
      <label className="text-sm font-semibold">Active dispatch<select value={selected?.dispatch_id || ''} onChange={(event) => { setSelectedId(event.target.value); setHistory(null); }} className={`${input} ml-2 max-w-full`}><option value="">Select an active delivery</option>{activeDispatches.map((dispatch) => <option key={dispatch.dispatch_id} value={dispatch.dispatch_id}>{dispatch.dispatch_id} · {dispatch.order_number} · {dispatch.status}</option>)}</select></label>
      <div className="ml-auto flex flex-wrap gap-2">
        {!running ? <button disabled={!selected || busy} onClick={() => void startSimulation()} className={primary}><Play size={15} />{busy ? 'Starting…' : 'Start DEMO simulation'}</button> : <button onClick={() => setRunning(false)} className={secondary}>Pause</button>}
        <button disabled={!selected || running} onClick={() => {
          if (!selected) return;
          setActionError('');
          void fetchDeliveryHistory(selected.dispatch_id).then(setHistory).catch((cause: unknown) => setActionError(cause instanceof Error ? cause.message : 'Telemetry history could not be loaded.'));
        }} className={secondary}>Refresh data</button>
        <button disabled={!selected || !running} onClick={() => setRunning(false)} className={secondary}>Stop simulation</button>
        <button disabled={!selected} onClick={() => void triggerShock()} className={secondary}><Zap size={15} />Generate demo shock</button>
      </div>
    </div>
    {(error || actionError) && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{actionError || error}</p>}
    {loading && <p className="mb-3 text-sm text-slate-500">Loading dispatches…</p>}
    {!selected && !loading && <p className={`${panel} text-sm text-slate-500`}>Create and dispatch an order before starting delivery monitoring.</p>}
    {selected && <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={panel}><p className="text-xs uppercase text-slate-500">Latest temperature</p><p className="mt-2 text-3xl font-bold">{latestTemperature ? `${latestTemperature.temperature_c.toFixed(1)}°C` : '—'}</p><p className="text-xs text-slate-500">{latestTemperature ? `${latestTemperature.status} · ${latestTemperature.source} source` : 'No readings saved'}</p></div>
        <div className={panel}><p className="text-xs uppercase text-slate-500">Location samples</p><p className="mt-2 text-3xl font-bold">{history?.locations.length ?? 0}</p><p className="text-xs text-slate-500">{points.at(-1)?.source || 'No location source'}</p></div>
        <div className={panel}><p className="text-xs uppercase text-slate-500">Integrity score</p><p className="mt-2 text-3xl font-bold">{selected.integrity_score == null ? '—' : `${selected.integrity_score}/100`}</p><p className="text-xs text-slate-500">{history?.events.length ?? 0} persisted transit events · simulation ticks {tick}</p></div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className={panel}><h2 className="mb-3 font-bold">Stored route map</h2><div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2"><svg viewBox="0 0 100 100" className="h-64 w-full" role="img" aria-label="Plotted stored delivery location samples"><path d="M5 50 H95 M50 5 V95" stroke="#e2e8f0" strokeDasharray="2 3" />{plotPoints && <><polyline points={plotPoints} fill="none" stroke="#059669" strokeWidth="1.5" /><circle cx={plotPoints.split(' ').at(-1)?.split(',')[0]} cy={plotPoints.split(' ').at(-1)?.split(',')[1]} r="3" fill="#047857" /></>}</svg><span className="absolute bottom-3 left-3 rounded bg-white/90 px-2 py-1 text-xs text-slate-600">{points.at(-1) ? `${points.at(-1)?.latitude.toFixed(5)}, ${points.at(-1)?.longitude.toFixed(5)} · ${points.at(-1)?.source}` : 'No location samples saved'}</span></div><p className="mt-2 text-xs text-amber-700">DEMO map plots generated coordinates and is not a real street map or GPS position.</p></section>
        <section className={panel}><h2 className="mb-3 font-bold">Temperature history</h2><div className="space-y-2">{(history?.temperatures.slice(-8).reverse() || []).map((reading, index) => <div key={`${reading.created_at}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm"><span>{new Date(reading.created_at).toLocaleTimeString()}</span><strong>{reading.temperature_c.toFixed(1)}°C</strong><span className={reading.status === 'NORMAL' ? 'text-emerald-700' : 'text-rose-700'}>{reading.status} · {reading.source}</span></div>)}{!history?.temperatures.length && <p className="text-sm text-slate-500">No temperature data recorded.</p>}</div></section>
      </div>
      <section className={`${panel} mt-5`}><h2 className="mb-3 font-bold">Transit events</h2><div className="space-y-2">{(history?.events.slice(-8).reverse() || []).map((event) => <p key={event.event_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"><span><strong>{event.event_type}</strong> · {event.description}</span><span>{event.severity} · {event.source} · {new Date(event.created_at).toLocaleTimeString()}</span></p>)}{!history?.events.length && <p className="text-sm text-slate-500">No transit events recorded.</p>}</div></section>
    </>}
  </div>;
}

export function AlertsConsole() {
  const { data: alerts, loading, error, refresh } = useResource(fetchLifecycleAlerts);
  const [filter, setFilter] = useState('ALL');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');
  const shown = (alerts || []).filter((alert) => filter === 'ALL' || filter === 'UNREAD' && !alert.is_read || filter === 'OPEN' && !alert.is_resolved || alert.severity === filter);
  const act = async (alert: LifecycleAlert, action: 'acknowledge' | 'resolve') => {
    setBusy(alert.alert_id);
    setActionError('');
    try {
      if (action === 'acknowledge') await acknowledgeLifecycleAlert(alert.alert_id);
      else await resolveLifecycleAlert(alert.alert_id);
      await refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Alert update failed.');
    } finally {
      setBusy('');
    }
  };
  return <div>
    <PageTitle eyebrow="Operations" title="Alert center" description="Review, acknowledge and resolve alerts saved by inspection and transit monitoring." icon={AlertTriangle} />
    <div className={`${panel} mb-4 flex flex-wrap items-center gap-3`}><p className="mr-auto text-sm text-slate-600">Unread <strong>{alerts?.filter((alert) => !alert.is_read).length ?? 0}</strong> · Open <strong>{alerts?.filter((alert) => !alert.is_resolved).length ?? 0}</strong></p><select value={filter} onChange={(event) => setFilter(event.target.value)} className={input}>{['ALL', 'OPEN', 'UNREAD', 'CRITICAL', 'WARNING', 'INFO'].map((value) => <option key={value}>{value}</option>)}</select></div>
    {actionError && <p role="alert" className="mb-4 text-sm text-rose-700">{actionError}</p>}
    <Feedback error={error} loading={loading} empty={!shown.length ? 'No alerts in this filter.' : undefined}>
      <div className="space-y-3">{shown.map((alert) => <article key={alert.alert_id} className={`${panel} flex flex-wrap items-center justify-between gap-4`}>
        <div><div className="flex items-center gap-2"><strong>{alert.category}</strong><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : alert.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'}`}>{alert.severity}</span>{!alert.is_read && <span className="text-xs font-bold text-emerald-700">UNREAD</span>}</div><p className="mt-1 text-sm text-slate-600">{alert.message}</p><p className="mt-1 text-xs text-slate-400">{new Date(alert.created_at).toLocaleString()} {alert.order_id ? `· Order ${alert.order_id}` : ''}</p></div>
        <div className="flex gap-2">{!alert.is_read && <button disabled={busy === alert.alert_id} onClick={() => void act(alert, 'acknowledge')} className={secondary}>Acknowledge</button>}{!alert.is_resolved && <button disabled={busy === alert.alert_id} onClick={() => void act(alert, 'resolve')} className={primary}>Resolve</button>}{alert.is_resolved && <span className="text-sm font-semibold text-emerald-700">Resolved</span>}</div>
      </article>)}</div>
    </Feedback>
  </div>;
}

export function AnalyticsConsole() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [inspectionStats, setInspectionStats] = useState<Array<Record<string, string | number>>>([]);
  const [deliveryStats, setDeliveryStats] = useState<Array<Record<string, string | number>>>([]);
  const [temperatureStats, setTemperatureStats] = useState<Array<Record<string, string | number>>>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = async (start?: string, end?: string) => {
    setLoading(true);
    setError('');
    try {
      const fromIso = start ? `${start}T00:00:00Z` : undefined;
      const toIso = end ? `${end}T23:59:59Z` : undefined;
      const [dashboard, inspections, deliveries, temperatures] = await Promise.all([
        getDashboardMetrics(fromIso, toIso),
        fetchAnalytics('inspections', fromIso, toIso),
        fetchAnalytics('deliveries', fromIso, toIso),
        fetchAnalytics('temperature', fromIso, toIso),
      ]);
      setMetrics(dashboard);
      setInspectionStats(inspections.data);
      setDeliveryStats(deliveries.data);
      setTemperatureStats(temperatures.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Analytics could not be loaded.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    Promise.all([getDashboardMetrics(), fetchAnalytics('inspections'), fetchAnalytics('deliveries'), fetchAnalytics('temperature')])
      .then(([dashboard, inspections, deliveries, temperatures]) => {
        if (!active) return;
        setMetrics(dashboard);
        setInspectionStats(inspections.data);
        setDeliveryStats(deliveries.data);
        setTemperatureStats(temperatures.data);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Analytics could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const totals = metrics ? [
    ['Orders', metrics.total_orders], ['Inspections', metrics.total_inspections], ['Accepted', metrics.fresh_count], ['Review', metrics.review_count], ['Rejected', metrics.rejected_count], ['Packed', metrics.packing_completed], ['Ready', metrics.ready_for_dispatch], ['In transit', metrics.in_transit], ['Delivered', metrics.delivered], ['Delayed', metrics.delayed], ['Temperature alerts', metrics.temperature_alerts], ['Transit alerts', metrics.transit_alerts],
  ] as const : [];
  const inspectionTrend = useMemo(() => {
    const byDate = new Map<string, { date: string; ACCEPT: number; REVIEW: number; REJECT: number }>();
    for (const row of inspectionStats) {
    const date = String(row.date || '');
    if (!date) continue;
    const point = byDate.get(date) || { date, ACCEPT: 0, REVIEW: 0, REJECT: 0 };
    const decision = String(row.decision || '').toUpperCase();
    if (decision === 'ACCEPT' || decision === 'REVIEW' || decision === 'REJECT') {
      point[decision] += Number(row.count) || 0;
    }
    byDate.set(date, point);
    }
    return [...byDate.values()].sort((first, second) => first.date.localeCompare(second.date));
  }, [inspectionStats]);
  const deliveryDistribution = useMemo(
    () => deliveryStats.map((row) => ({ status: String(row.status || 'Unknown').replaceAll('_', ' '), count: Number(row.count) || 0 })),
    [deliveryStats],
  );
  const temperatureTrend = useMemo(
    () => temperatureStats
    .filter((row) => Number.isFinite(Number(row.temperature_c)) && row.created_at)
    .map((row) => ({
      time: new Date(String(row.created_at)).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      temperature: Number(row.temperature_c),
    })),
    [temperatureStats],
  );
  const deliveryColors = ['#059669', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];
  return <div>
    <PageTitle eyebrow="Reporting & insights" title="Operational analytics" description="Explore inspection quality, delivery outcomes and cold-chain readings from saved warehouse records." icon={Activity} />
    <form onSubmit={(event) => { event.preventDefault(); void reload(from, to); }} className={`${panel} mb-5 flex flex-wrap items-end justify-between gap-4`}>
    <div><h2 className="font-bold text-slate-900">Report period</h2><p className="mt-1 text-xs text-slate-500">Choose a date range to refresh metrics and charts.</p></div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-xs font-medium text-slate-500">From<input type="date" max={to || undefined} value={from} onChange={(event) => setFrom(event.target.value)} className={input} /></label>
      <label className="grid gap-1 text-xs font-medium text-slate-500">To<input type="date" min={from || undefined} value={to} onChange={(event) => setTo(event.target.value)} className={input} /></label>
      <button className={primary} disabled={loading}><Activity size={16} />{loading ? 'Updating…' : 'Apply date range'}</button>
    </div>
    </form>
    {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <section aria-label="Warehouse key metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {totals.map(([label, value], index) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-slate-500">{label}</p><span className={`h-2.5 w-2.5 rounded-full ${['bg-emerald-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'][index % 6]}`} /></div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{loading ? '—' : value}</p>
      <p className="mt-1 text-[11px] text-slate-400">Current period</p>
    </article>)}
    </section>
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
    <section className={panel}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-bold text-slate-900">Inspection quality trend</h2><p className="mt-1 text-xs text-slate-500">Daily decisions from completed inspections</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{inspectionTrend.reduce((sum, point) => sum + point.ACCEPT + point.REVIEW + point.REJECT, 0)} inspections</span></div>
      {inspectionTrend.length ? <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={inspectionTrend} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value: string) => value.slice(5)} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
            <Bar dataKey="ACCEPT" name="Accepted" stackId="inspections" fill="#059669" radius={[0, 0, 0, 0]} />
            <Bar dataKey="REVIEW" name="Review" stackId="inspections" fill="#f59e0b" />
            <Bar dataKey="REJECT" name="Rejected" stackId="inspections" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div> : <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50 text-center"><div><Activity className="mx-auto mb-2 h-8 w-8 text-slate-300" /><p className="text-sm font-semibold text-slate-600">No inspection trend yet</p><p className="mt-1 text-xs text-slate-400">Saved inspections will appear here.</p></div></div>}
    </section>
    <section className={panel}>
      <div className="mb-4"><h2 className="font-bold text-slate-900">Delivery outcomes</h2><p className="mt-1 text-xs text-slate-500">Breakdown of dispatches by current status</p></div>
      {deliveryDistribution.length ? <div className="grid items-center gap-3 sm:grid-cols-[minmax(160px,1fr)_minmax(110px,.9fr)]">
        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={deliveryDistribution} dataKey="count" nameKey="status" innerRadius="58%" outerRadius="84%" paddingAngle={3} stroke="white" strokeWidth={3}>
                {deliveryDistribution.map((entry, index) => <Cell key={entry.status} fill={deliveryColors[index % deliveryColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-3">{deliveryDistribution.map((entry, index) => <li key={entry.status} className="flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: deliveryColors[index % deliveryColors.length] }} /><span className="truncate">{entry.status}</span></span><strong className="text-slate-900">{entry.count}</strong></li>)}</ul>
      </div> : <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 text-center"><div><Truck className="mx-auto mb-2 h-8 w-8 text-slate-300" /><p className="text-sm font-semibold text-slate-600">No dispatches yet</p><p className="mt-1 text-xs text-slate-400">Delivery outcomes appear after dispatch.</p></div></div>}
    </section>
    </div>
    <section className={`${panel} mt-5`}>
    <div className="mb-4"><h2 className="font-bold text-slate-900">Cold-chain temperature</h2><p className="mt-1 text-xs text-slate-500">Recorded temperatures across recent delivery readings</p></div>
    {temperatureTrend.length ? <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={temperatureTrend} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} unit="°C" />
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
          <Line type="monotone" dataKey="temperature" name="Temperature" stroke="#0ea5e9" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div> : <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 text-center"><div><Thermometer className="mx-auto mb-2 h-8 w-8 text-slate-300" /><p className="text-sm font-semibold text-slate-600">No temperature readings yet</p><p className="mt-1 text-xs text-slate-400">Cold-chain telemetry will chart here once saved.</p></div></div>}
    </section>
    <section className={`${panel} mt-5`}>
    <div className="mb-4"><h2 className="font-bold text-slate-900">Recent cold-chain readings</h2><p className="mt-1 text-xs text-slate-500">Latest saved telemetry events (up to 20)</p></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="text-xs uppercase tracking-wide text-slate-400"><th className="border-b py-3">Time</th><th className="border-b py-3">Dispatch</th><th className="border-b py-3">Temperature</th><th className="border-b py-3">Status</th><th className="border-b py-3">Source</th></tr></thead><tbody>{temperatureStats.slice(-20).reverse().map((row, index) => <tr key={`${row.reading_id}-${index}`} className="hover:bg-slate-50"><td className="border-b py-3 text-slate-600">{new Date(String(row.created_at)).toLocaleString()}</td><td className="border-b py-3 font-mono text-xs">{row.dispatch_id}</td><td className="border-b py-3 font-semibold">{row.temperature_c}°C <span className="font-normal text-slate-400">({row.minimum_c}–{row.maximum_c}°C)</span></td><td className="border-b py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${String(row.status).toUpperCase() === 'NORMAL' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{row.status}</span></td><td className="border-b py-3 text-slate-500">{row.source}</td></tr>)}</tbody></table>{!temperatureStats.length && <p className="py-6 text-center text-sm text-slate-500">No temperature readings in this time range.</p>}</div>
    </section>
  </div>;
}

export function CustomerTrackingConsole() {
  const [token, setToken] = useState('');
  const [lookup, setLookup] = useState('');
  const [tracking, setTracking] = useState<Awaited<ReturnType<typeof fetchCustomerTracking>> | null>(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const load = async (trackingId: string) => {
    setError('');
    setFeedbackMessage('');
    try {
      setTracking(await fetchCustomerTracking(trackingId));
      setToken(trackingId);
      setLookup(trackingId);
    } catch (cause) {
      setTracking(null);
      setError(cause instanceof Error ? cause.message : 'Tracking details could not be loaded.');
    }
  };
  const initialToken = useSyncExternalStore(subscribeToLocation, getTrackingTokenFromLocation, () => '');
  useEffect(() => {
    if (!initialToken) return;
    const timerId = window.setTimeout(() => { void load(initialToken); }, 0);
    return () => window.clearTimeout(timerId);
  }, [initialToken]);
  useEffect(() => {
    if (!token || tracking?.status === 'DELIVERED') return;
    const interval = setInterval(() => {
      void fetchCustomerTracking(token).then(setTracking).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Tracking refresh failed.'));
    }, 15000);
    return () => clearInterval(interval);
  }, [token, tracking?.status]);
  const sendFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedbackMessage('');
    setError('');
    try {
      await submitCustomerFeedback(token, rating, comment);
      setFeedbackMessage('Thank you. Your feedback has been recorded.');
      setTracking((current) => current ? { ...current, feedback_available: false } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Feedback could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900"><div className="mx-auto max-w-2xl">
    <Link href="/login" className="text-sm font-bold text-emerald-700">FreshGuard AI</Link><p className="mt-10 text-sm font-semibold text-emerald-700">Customer portal</p><h1 className="mt-2 text-3xl font-bold">Track your delivery</h1><p className="mt-2 text-slate-500">Enter the private tracking token shared when your order was created.</p>
    <form onSubmit={(event) => { event.preventDefault(); void load(lookup.trim()); }} className={`${panel} mt-6 flex gap-2`}><input required value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="Tracking token" className={`${input} min-w-0 flex-1`} /><button className={primary}>Track</button></form>
    {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {tracking && <section className={`${panel} mt-5`}>
      <p className="text-xs uppercase text-slate-400">Order</p><h2 className="mt-1 text-xl font-bold">{tracking.order_number}</h2><p className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800"><CircleDot size={15} />{tracking.status}</p>
      <ol className="my-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{['Inspection', 'Packed', 'In transit', 'Delivered'].map((status, index) => { const complete = index === 0 ? tracking.inspection_status === 'COMPLETED' : index === 1 ? tracking.packing_status === 'COMPLETED' : index === 2 ? ['DISPATCHED', 'IN_TRANSIT', 'DELAYED', 'DELIVERED'].includes(tracking.status) : tracking.status === 'DELIVERED'; return <li key={status} className={`rounded-xl p-3 ${complete ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-400'}`}><CheckCircle2 size={16} className="mb-1" />{status}</li>; })}</ol>
      <p className="text-sm text-slate-600">Estimated delivery: {tracking.expected_delivery_at ? new Date(tracking.expected_delivery_at).toLocaleString() : 'Not scheduled yet'}</p>{tracking.delivered_at && <p className="mt-1 text-sm text-emerald-700">Delivered {new Date(tracking.delivered_at).toLocaleString()}</p>}
      {tracking.location && <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><MapPin size={14} />{tracking.location.latitude.toFixed(5)}, {tracking.location.longitude.toFixed(5)} · {tracking.location.source === 'DEMO' ? 'simulated location' : 'provider location'}</p>}
      {feedbackMessage && <p role="status" className="mt-4 text-sm text-emerald-700">{feedbackMessage}</p>}
      {tracking.feedback_available && <form onSubmit={sendFeedback} className="mt-6 border-t border-slate-100 pt-5"><h3 className="font-bold">Share delivery feedback</h3><div className="mt-3 flex items-center gap-3"><label className="text-sm">Rating <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className={`${input} ml-2`}>{[5, 4, 3, 2, 1].map((item) => <option key={item} value={item}>{item} / 5</option>)}</select></label></div><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder="Optional comment" className={`${input} mt-3 min-h-24 w-full`} /><button disabled={submitting} className={`${primary} mt-3`}>{submitting ? 'Sending…' : 'Submit feedback'}</button></form>}
    </section>}
  </div></main>;
}

export function ThresholdsConsole() {
  const { data, loading, error, refresh } = useResource(fetchTemperatureThresholds);
  const [values, setValues] = useState<Record<string, { min: number; max: number }> | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const displayedValues = values ?? data ?? {};
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError('');
    setSaved(false);
    try {
      await saveTemperatureThresholds(displayedValues);
      setSaved(true);
      await refresh();
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Thresholds could not be saved.');
    }
  };
  return <div>
    <PageTitle eyebrow="Configuration" title="Cold-chain thresholds" description="Temperature alert limits are persisted per warehouse and category. Saving requires an administrator role." icon={Thermometer} />
    {(error || saveError) && <p role="alert" className="mb-4 text-sm text-rose-700">{saveError || error}</p>}
    {loading ? <p>Loading configured limits…</p> : <form onSubmit={save} className={`${panel} max-w-3xl`}>
      <div className="grid grid-cols-[minmax(120px,1fr)_1fr_1fr] gap-3 border-b pb-3 text-xs font-bold uppercase text-slate-500"><span>Category</span><span>Min °C</span><span>Max °C</span></div>
      {Object.entries(displayedValues).map(([category, range]) => <div key={category} className="grid grid-cols-[minmax(120px,1fr)_1fr_1fr] items-center gap-3 border-b border-slate-100 py-3"><strong className="text-sm">{category}</strong><input type="number" step="0.1" value={range.min} onChange={(event) => setValues((current) => ({ ...(current ?? data ?? {}), [category]: { ...range, min: Number(event.target.value) } }))} className={input} /><input type="number" step="0.1" value={range.max} onChange={(event) => setValues((current) => ({ ...(current ?? data ?? {}), [category]: { ...range, max: Number(event.target.value) } }))} className={input} /></div>)}
      {!Object.keys(displayedValues).length && <p className="py-4 text-sm text-slate-500">No custom limits set. Backend environment defaults are active.</p>}
      <button className={`${primary} mt-4`}><Check size={16} />Save category thresholds</button>{saved && <p className="mt-3 text-sm text-emerald-700">Thresholds saved.</p>}
    </form>}
  </div>;
}

export function ReportsConsole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof fetchReportSummary>> | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetchReportSummary()
      .then((result) => { if (active) setSummary(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Report summary could not be loaded.'); })
      .finally(() => { if (active) setSummaryLoading(false); });
    return () => { active = false; };
  }, []);
  const download = async () => {
    setLoading(true);
    setError('');
    try {
      const { downloadInspectionReport } = await import('@/lib/workflow-api');
      await downloadInspectionReport();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Report export failed.');
    } finally {
      setLoading(false);
    }
  };
  return <div>
    <PageTitle eyebrow="Reporting" title="Operational reports" description="Export persisted inspection data from the authenticated backend." icon={Activity} />
    {error && <p role="alert" className="mb-4 text-sm text-rose-700">{error}</p>}
    <section className={`${panel} max-w-xl`}><h2 className="font-bold">Inspection decisions CSV</h2><p className="mt-2 text-sm text-slate-500">Includes inspection ID, model quality score, decision, employee ID, and timestamp for this warehouse.</p>
      {summaryLoading ? <p className="mt-4 text-sm text-slate-500">Loading saved report totals…</p> : summary && <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">{[['Total inspections', summary.total_inspections], ['Accepted', summary.fresh], ['Review', summary.review], ['Rejected', summary.rejected], ['Average score', summary.average_score]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl>}
      <button disabled={loading} onClick={() => void download()} className={`${primary} mt-5`}>{loading ? 'Preparing…' : 'Download inspection report'}</button></section>
  </div>;
}
