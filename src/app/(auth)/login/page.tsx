'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [warehouse, setWarehouse] = useState('WH-MTH-001');
  const [employee, setEmployee] = useState('EMP-1001');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (warehouse !== 'WH-MTH-001' || employee !== 'EMP-1001' || password !== 'demo123') {
      setError('Those credentials do not match the demo warehouse account.');
      setLoading(false);
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      const response = await fetch(`${apiUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ warehouse_id: warehouse, employee_id: employee, password }) });
      if (!response.ok) {
        setError('Unable to sign in to the backend. Check your warehouse credentials.');
        setLoading(false);
        return;
      }
      const result = await response.json();
      localStorage.setItem('freshguard_access_token', result.access_token);
    }
    localStorage.setItem('freshguard_auth_user', JSON.stringify({ name: 'Krishna Mishra', employeeId: employee, warehouseId: warehouse }));
    router.push('/dashboard');
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_480px]">
      <section className="hidden bg-emerald-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><ShieldCheck size={25} /></span><strong className="text-xl">FreshGuard <span className="text-emerald-200">AI</span></strong></div>
          <div className="mt-28 max-w-xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-emerald-200">AI-powered produce quality inspection</p><h1 className="mt-5 text-6xl font-bold leading-[1.05] tracking-tight">Inspect smarter.<br />Reduce waste.<br /><span className="text-emerald-200">Protect quality.</span></h1><p className="mt-7 max-w-md text-lg leading-8 text-emerald-50">A clear, dependable visual inspection workflow for every warehouse intake.</p></div>
        </div>
        <p className="text-sm text-emerald-100">Authorized warehouse personnel only</p>
      </section>
      <section className="flex items-center justify-center bg-[#f6f8f7] p-6 sm:p-12"><div className="w-full max-w-md"><div className="mb-10 lg:hidden"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white"><ShieldCheck size={22} /></span><strong className="text-xl">FreshGuard <span className="text-emerald-600">AI</span></strong></div></div><p className="text-sm font-bold text-emerald-700">Welcome back</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Sign in to FreshGuard AI</h2><p className="mt-2 text-slate-500">Use your warehouse credentials to continue.</p><form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{error && <div className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}<Field label="Warehouse ID" value={warehouse} onChange={setWarehouse} /><Field label="Employee ID" value={employee} onChange={setEmployee} /><label className="block text-sm font-semibold">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3.5 text-slate-400" size={17} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-emerald-500" /></div></label><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="h-4 w-4 accent-emerald-600" />Remember me</label><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{loading ? 'Signing in...' : 'Sign in'}{!loading && <ArrowRight size={18} />}</button><p className="text-center text-sm font-semibold text-emerald-700">Forgot password?</p></form><div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500"><CheckCircle2 size={15} className="text-emerald-600" />Authorized warehouse personnel only</div><p className="mt-5 text-center text-xs text-slate-400">Demo: WH-MTH-001 · EMP-1001 · demo123</p></div></section>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-500" /></label>;
}
