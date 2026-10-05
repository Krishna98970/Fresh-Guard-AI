import { Check, CircleAlert, X } from "lucide-react";
import type { Status } from "@/lib/types";

const config = { Fresh: { icon: Check, className: "status-fresh" }, "Needs Review": { icon: CircleAlert, className: "status-review" }, Rejected: { icon: X, className: "status-rejected" } } as const;

export default function StatusBadge({ status }: { status: Status }) {
  const item = config[status];
  const Icon = item.icon;
  return <span className={`status-badge ${item.className}`}><Icon size={14} />{status}</span>;
}
