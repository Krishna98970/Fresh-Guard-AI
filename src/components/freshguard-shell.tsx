'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Activity, BarChart3, Bell, ClipboardList, FileText, HelpCircle, LayoutDashboard, LogOut, Menu, Package, PackageCheck, ScanLine, Settings, ShieldCheck, ShoppingBag, Thermometer, Truck, User, Users, X } from 'lucide-react';
import { acknowledgeAlert, getAlerts, type WarehouseAlert } from '@/lib/api';

interface SessionUser {
  name?: string;
  role?: string;
  warehouse_id?: string;
  employee_id?: string;
}

const nav = [
  ['Dashboard', '/dashboard', LayoutDashboard], ['Inspect', '/inspect', ScanLine], ['Inventory', '/inventory', Package], ['History', '/history', ClipboardList], ['Analytics', '/analytics', BarChart3], ['Reports', '/reports', FileText],
  ['Orders', '/dashboard/orders', ShoppingBag], ['Packing', '/dashboard/packing', PackageCheck], ['Deliveries', '/dashboard/deliveries', Truck], ['Riders', '/dashboard/riders', Users], ['Telemetry', '/dashboard/telemetry', Activity], ['Alerts', '/dashboard/alerts', Bell], ['Temperature thresholds', '/settings/thresholds', Thermometer],
];

function subscribeToSession(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSessionSnapshot() {
  return localStorage.getItem('freshguard_auth_user') || '';
}

export function FreshGuardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const sessionSnapshot = useSyncExternalStore(subscribeToSession, getSessionSnapshot, () => '');
  const sessionUser = (() => {
    try {
      return sessionSnapshot ? JSON.parse(sessionSnapshot) as SessionUser : {};
    } catch {
      return {};
    }
  })();
  const [alerts, setAlerts] = useState<WarehouseAlert[]>([]);
  const [alertError, setAlertError] = useState('');
  const close = () => setOpen(false);

  useEffect(() => {
    if (!localStorage.getItem('freshguard_access_token')) router.replace('/login');
  }, [router]);

  useEffect(() => {
    if (!notificationsOpen) return;
    let active = true;
    getAlerts()
      .then((items) => { if (active) setAlerts(items); })
      .catch((cause: unknown) => { if (active) setAlertError(cause instanceof Error ? cause.message : 'Alerts could not be loaded.'); });
    return () => { active = false; };
  }, [notificationsOpen]);

  const logout = () => {
    localStorage.removeItem('freshguard_auth_user');
    localStorage.removeItem('freshguard_access_token');
    router.push('/login');
  };

  const markAlertRead = async (alert: WarehouseAlert) => {
    if (alert.is_read) return;
    try {
      await acknowledgeAlert(alert.alert_id);
      setAlerts((current) => current.map((item) => item.alert_id === alert.alert_id ? { ...item, is_read: true } : item));
    } catch (cause) {
      setAlertError(cause instanceof Error ? cause.message : 'Alert could not be acknowledged.');
    }
  };

  const displayName = sessionUser.name || 'Warehouse user';
  const warehouseId = sessionUser.warehouse_id || 'Warehouse';
  const role = sessionUser.role?.replaceAll('_', ' ') || 'Authorized user';
  const isDispatchManager = sessionUser.role === 'DISPATCH_MANAGER';
  const dispatchPaths = ['/dashboard/orders', '/dashboard/deliveries', '/dashboard/riders', '/dashboard/telemetry', '/dashboard/alerts', '/help'];
  const dispatchRouteAllowed = dispatchPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const unreadCount = alerts.filter((alert) => !alert.is_read).length;

  useEffect(() => {
    if (!isDispatchManager) return;
    if (pathname === '/dashboard' || !dispatchRouteAllowed) router.replace('/dashboard/deliveries');
  }, [dispatchRouteAllowed, isDispatchManager, pathname, router]);

  return <div className="min-h-screen bg-[#f6f8f7] text-slate-900">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6"><Link href="/dashboard" className="flex items-center gap-3" onClick={close}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white"><ShieldCheck size={22} /></span><span><strong className="block text-base tracking-tight">FreshGuard <span className="text-emerald-600">AI</span></strong><small className="text-[11px] text-slate-500">Produce quality control</small></span></Link><button className="lg:hidden" onClick={close} aria-label="Close menu"><X size={20} /></button></div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-7"><p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Workspace</p>{nav.filter(([, href]) => !isDispatchManager || dispatchPaths.includes(href as string)).map(([label, href, Icon]) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href as string} href={href as string} onClick={close} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={18} />{label as string}</Link>; })}</nav>
      <div className="shrink-0 border-t border-slate-100 px-4 pb-4 pt-2">{!isDispatchManager && <Link href="/settings" onClick={close} className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Settings size={18} />Settings</Link>}<Link href="/help" onClick={close} className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><HelpCircle size={18} />Help centre</Link><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 pt-4 text-sm font-semibold text-slate-500 hover:text-rose-600"><LogOut size={18} />Log out</button></div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={close} aria-label="Close navigation" />}
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8"><div className="flex items-center gap-3"><button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button><div className="hidden text-sm text-slate-500 sm:block">Warehouse <strong className="text-slate-800">{warehouseId}</strong></div></div><div className="flex items-center gap-2"><div className="relative"><button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" onClick={() => { setAlertError(''); setNotificationsOpen(!notificationsOpen); }} aria-label="Alerts"><Bell size={19} />{unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">{unreadCount}</span>}</button>{notificationsOpen && <div className="absolute right-0 top-12 z-30 w-80 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-xl"><strong className="mb-3 block">Warehouse alerts</strong>{alertError && <p role="alert" className="mb-2 text-xs text-rose-700">{alertError}</p>}{alerts.length ? alerts.slice(0, 5).map((alert) => <button key={alert.alert_id} onClick={() => void markAlertRead(alert)} className="block w-full border-t border-slate-100 py-2 text-left"><span className="font-semibold">{alert.category} · {alert.severity}</span><span className="block text-xs text-slate-500">{alert.message}</span></button>) : !alertError && <p className="py-2 text-slate-500">No alerts.</p>}</div>}</div><div className="relative"><button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-slate-50"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">{displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span className="hidden sm:block"><strong className="block text-sm">{displayName}</strong><small className="text-xs text-slate-500">{role}</small></span></button>{profileOpen && <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">{!isDispatchManager && <Link href="/settings" className="flex gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"><User size={16} />My profile</Link>}<Link href="/help" className="flex gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"><HelpCircle size={16} />Help</Link><button onClick={logout} className="flex w-full gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"><LogOut size={16} />Logout</button></div>}</div></div></header><main className="mx-auto max-w-[1440px] p-5 sm:p-8">{isDispatchManager && !dispatchRouteAllowed ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">Opening your dispatch workspace…</p> : children}</main></div>
  </div>;
}
