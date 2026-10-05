import type { LucideIcon } from "lucide-react";

export default function DashboardCard({ label, value, detail, icon: Icon, tone = "green" }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: string }) {
  return <article className={`stat-card tone-${tone}`}><div className="stat-icon"><Icon size={19} /></div><p>{label}</p><strong>{value}</strong><span>{detail}</span></article>;
}
