"use client";
import { FormEvent, useState } from "react";
import { Check, ClipboardCheck, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { loginToBackend } from "@/lib/api";
import { useAppState } from "@/components/AppProviders";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppState();
  const [warehouse, setWarehouse] = useState("WH-MTH-001");
  const [employee, setEmployee] = useState("EMP-1001");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await loginToBackend(warehouse, employee, password);
      localStorage.setItem("freshguard-access-token", session.accessToken);
      localStorage.setItem("freshguard-user", JSON.stringify(session.user));
      localStorage.setItem("freshguard-auth", "true");
      setUser(session.user);
      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in to the backend.");
    } finally {
      setLoading(false);
    }
  }
  return <main className="login-page"><section className="login-brand-panel"><div className="login-brand"><span className="brand-mark large"><ShieldCheck size={25} /></span><span>FreshGuard <b>AI</b></span></div><div className="login-message"><p className="eyebrow light">Warehouse quality operations</p><h1>Inspect smarter.<br />Reduce waste.<br /><em>Protect quality.</em></h1><p>AI-powered visual inspection for teams moving fresh produce with confidence.</p></div><div className="login-foot"><span><Check size={14} /> Visible quality indicators</span><span><Check size={14} /> Built for the warehouse floor</span></div></section><section className="login-form-panel"><div className="login-card"><div className="mobile-login-brand"><ClipboardCheck size={22} /> FreshGuard <b>AI</b></div><p className="eyebrow">Team access</p><h2>Welcome back</h2><p className="form-intro">Sign in to your warehouse workspace.</p><form onSubmit={submit}><label>Warehouse ID<input value={warehouse} onChange={(event) => setWarehouse(event.target.value)} autoComplete="organization" /></label><label>Employee ID<input value={employee} onChange={(event) => setEmployee(event.target.value)} autoComplete="username" /></label><label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label><div className="form-row"><label className="checkbox-label"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />Remember me</label><button type="button" className="text-button">Forgot password?</button></div>{error && <p className="form-error">{error}</p>}<button className="button button-primary full-width" type="submit" disabled={loading}>{loading ? "Signing in..." : <>Sign in <span>→</span></>}</button></form><p className="authorized"><ShieldCheck size={16} /> Authorized warehouse personnel only</p></div></section></main>;
}
