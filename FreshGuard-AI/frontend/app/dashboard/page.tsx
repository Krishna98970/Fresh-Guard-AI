"use client";
import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, Clock3, PackageCheck, ShieldAlert, XCircle } from "lucide-react";
import { useAppState } from "@/components/AppProviders";
import DashboardCard from "@/components/DashboardCard";
import StatusBadge from "@/components/StatusBadge";
import { inspections } from "@/lib/mockData";

export default function DashboardPage() {
  const { user, inspections: saved } = useAppState();
  const rows = [...saved, ...inspections].slice(0, 5);
  return <div className="content-stack"><section className="page-heading dashboard-heading"><div><p className="eyebrow">Operations overview</p><h1>Good morning, {user.name.split(" ")[0]}</h1><p className="page-subtitle">Here is what is happening across <strong>{user.warehouseId}</strong> today.</p></div><Link className="button button-primary" href="/inspect"><ClipboardCheck size={18} /> New inspection</Link></section><section className="stats-grid"><DashboardCard label="Total inspections" value="1,248" detail="↑ 12.5% · Today" icon={ClipboardCheck} /><DashboardCard label="Fresh produce" value="1,087" detail="87.1% of total" icon={PackageCheck} tone="mint" /><DashboardCard label="Needs review" value="96" detail="7.7% of total" icon={ShieldAlert} tone="amber" /><DashboardCard label="Rejected" value="65" detail="5.2% of total" icon={XCircle} tone="rose" /></section><section className="panel recent-panel"><div className="panel-heading"><div><p className="eyebrow">Live queue</p><h2>Recent inspections</h2></div><Link className="quiet-link" href="/history">View all <ArrowUpRight size={16} /></Link></div><div className="table-wrap"><table><thead><tr><th>ID</th><th>Product</th><th>Batch</th><th>Employee</th><th>Score</th><th>Status</th><th>Time</th><th /></tr></thead><tbody>{rows.map((inspection) => <tr key={inspection.inspectionId}><td className="strong-cell">{inspection.inspectionId}</td><td>{inspection.product}</td><td>{inspection.batch}</td><td>{inspection.employeeId}</td><td><strong>{inspection.score}</strong>/100</td><td><StatusBadge status={inspection.status} /></td><td><span className="time-cell"><Clock3 size={14} />{inspection.timestamp.replace("Today, ", "")}</span></td><td><Link className="table-action" href={`/history?id=${inspection.inspectionId}`}>View</Link></td></tr>)}</tbody></table></div></section></div>;
}
