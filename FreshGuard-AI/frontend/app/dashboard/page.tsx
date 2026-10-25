"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, Clock3, PackageCheck, ShieldAlert, XCircle } from "lucide-react";
import { useAppState } from "@/components/AppProviders";
import DashboardCard from "@/components/DashboardCard";
import StatusBadge from "@/components/StatusBadge";
import { getInspectionHistory } from "@/lib/api";
import type { Inspection } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAppState();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getInspectionHistory()
      .then(setInspections)
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Could not load recent inspections.");
      });
  }, []);

  const freshCount = inspections.filter((inspection) => inspection.decision === "ACCEPT").length;
  const reviewCount = inspections.filter((inspection) => inspection.decision === "REVIEW").length;
  const rejectedCount = inspections.filter((inspection) => inspection.decision === "REJECT").length;
  const rows = inspections.slice(0, 5);

  return (
    <div className="content-stack">
      <section className="page-heading dashboard-heading">
        <div><p className="eyebrow">Operations overview</p><h1>Good morning, {user.name.split(" ")[0]}</h1><p className="page-subtitle">Saved inspections for <strong>{user.warehouseId}</strong>.</p></div>
        <Link className="button button-primary" href="/inspect"><ClipboardCheck size={18} /> New inspection</Link>
      </section>
      {error && <div className="inline-error">{error}</div>}
      <section className="stats-grid">
        <DashboardCard label="Total inspections" value={String(inspections.length)} detail="Saved in this warehouse" icon={ClipboardCheck} />
        <DashboardCard label="Fresh produce" value={String(freshCount)} detail="Classified as fresh" icon={PackageCheck} tone="mint" />
        <DashboardCard label="Needs review" value={String(reviewCount)} detail="Manual review required" icon={ShieldAlert} tone="amber" />
        <DashboardCard label="Rejected" value={String(rejectedCount)} detail="Classified as rotten" icon={XCircle} tone="rose" />
      </section>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">Saved records</p><h2>Recent inspections</h2></div>
          <Link className="quiet-link" href="/history">View all <ArrowUpRight size={16} /></Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Model</th><th>Result</th><th>Employee</th><th>Score</th><th>Status</th><th>Time</th><th /></tr></thead>
            <tbody>{rows.map((inspection) => (
              <tr key={inspection.inspectionId}>
                <td className="strong-cell">{inspection.inspectionId}</td><td>{inspection.inspectionType}</td><td>{inspection.product}</td>
                <td>{inspection.employeeId}</td><td><strong>{inspection.score}</strong>/100</td><td><StatusBadge status={inspection.status} /></td>
                <td><span className="time-cell"><Clock3 size={14} />{inspection.timestamp}</span></td>
                <td><Link className="table-action" href={`/history?id=${inspection.inspectionId}`}>View</Link></td>
              </tr>
            ))}</tbody>
          </table>
          {!rows.length && <div className="empty-state"><ClipboardCheck size={27} /><h3>No saved inspections</h3><p>Run a model inspection to see the saved result here.</p></div>}
        </div>
      </section>
    </div>
  );
}

