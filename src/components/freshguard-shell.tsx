'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, Bell, ClipboardList, FileText, HelpCircle, LayoutDashboard, LogOut, Menu, Package, ScanLine, Settings, ShieldCheck, User, X } from 'lucide-react';

const nav = [
  ['Dashboard', '/dashboard', LayoutDashboard], ['Inspect', '/inspect', ScanLine], ['Inventory', '/inventory', Package], ['History', '/history', ClipboardList], ['Analytics', '/analytics', BarChart3], ['Reports', '/reports', FileText],
];

export function FreshGuardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const close = () => setOpen(false);
  const logout = () => { localStorage.removeItem('freshguard_auth_user'); localStorage.removeItem('freshguard_access_token'); router.push('/login'); };

  return <div className="min-h-screen bg-[#f6f8f7] text-slate-900">
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6"><Link href="/dashboard" className="flex items-center gap-3" onClick={close}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white"><ShieldCheck size={22} /></span><span><strong className="block text-base tracking-tight">FreshGuard <span className="text-emerald-600">AI</span></strong><small className="text-[11px] text-slate-500">Produce quality control</small></span></Link><button className="lg:hidden" onClick={close} aria-label="Close menu"><X size={20} /></button></div>
      <div className="px-4 pt-7"><p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Workspace</p>{nav.map(([label, href, Icon]) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href as string} href={href as string} onClick={close} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={18} />{label as string}</Link>; })}</div>
      <div className="absolute bottom-5 w-full px-4"><Link href="/settings" onClick={close} className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Settings size={18} />Settings</Link><Link href="/help" onClick={close} className="mb-3 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><HelpCircle size={18} />Help centre</Link><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 pt-4 text-sm font-semibold text-slate-500 hover:text-rose-600"><LogOut size={18} />Log out</button></div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={close} aria-label="Close navigation" />}
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8"><div className="flex items-center gap-3"><button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button><div className="hidden text-sm text-slate-500 sm:block">Warehouse <strong className="text-slate-800">WH-MTH-001</strong></div></div><div className="flex items-center gap-2"><button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications"><Bell size={19} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500" /></button>{notificationsOpen && <div className="absolute right-20 top-16 w-72 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-xl"><strong className="mb-3 block">Notifications</strong><p className="border-b border-slate-100 py-2">New inspection completed</p><p className="border-b border-slate-100 py-2">Batch APL-2045 requires review</p><p className="py-2">Weekly report is ready</p></div>}<div className="relative"><button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-slate-50"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">KM</span><span className="hidden sm:block"><strong className="block text-sm">Krishna Mishra</strong><small className="text-xs text-slate-500">Warehouse employee</small></span></button>{profileOpen && <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><Link href="/settings" className="flex gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"><User size={16} />My profile</Link><Link href="/help" className="flex gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"><HelpCircle size={16} />Help</Link><button onClick={logout} className="flex w-full gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"><LogOut size={16} />Logout</button></div>}</div></div></header><main className="mx-auto max-w-[1440px] p-5 sm:p-8">{children}</main></div>
  </div>;
}
