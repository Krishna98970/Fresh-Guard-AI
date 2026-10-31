"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Eye, Search, SlidersHorizontal } from "lucide-react";
import { getInspectionHistory } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import type { Inspection } from "@/lib/types";

export default function HistoryPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [selected, setSelected] = useState<Inspection | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInspectionHistory()
      .then(setInspections)
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Could not load inspection history.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => inspections.filter((item) => {
    const matchesSearch = `${item.inspectionId} ${item.product} ${item.batch} ${item.employeeId}`.toLowerCase().includes(query.toLowerCase());
    return matchesSearch && (status === "All statuses" || item.status === status);
  }), [inspections, query, status]);

  return (
    <div className="content-stack">
      <section className="page-heading">
        <div><p className="eyebrow">Traceability</p><h1>Inspection history</h1><p className="page-subtitle">Saved model inspections from your warehouse.</p></div>
      </section>
      {error && <div className="inline-error">{error}</div>}
      <section className="panel filters-panel">
        <div className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID, batch, product or employee..." /></div>
        <div className="filter-select"><SlidersHorizontal size={16} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Fresh</option><option>Needs Review</option><option>Rejected</option></select></div>
        <span className="date-button"><CalendarDays size={16} />All saved records</span>
      </section>
      <section className="panel table-panel">
        <div className="table-meta"><strong>{loading ? "Loading inspections..." : `${filtered.length} inspections`}</strong><span>Most recent first</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Inspection ID</th><th>Date</th><th>Model</th><th>Product / class</th><th>Score</th><th>Status</th><th>Employee</th><th /></tr></thead>
            <tbody>{filtered.map((item) => (
              <tr key={item.inspectionId}>
                <td className="strong-cell">{item.inspectionId}</td><td>{item.timestamp}</td><td>{item.inspectionType}</td><td>{item.product}</td>
                <td><strong>{item.score}</strong>/100</td><td><StatusBadge status={item.status} /></td><td>{item.employeeId}</td>
                <td><button className="table-action" onClick={() => setSelected(item)}><Eye size={15} />View</button></td>
              </tr>
            ))}</tbody>
          </table>
          {!loading && !filtered.length && <div className="empty-state"><Search size={27} /><h3>No inspections found</h3><p>Completed model inspections will appear here.</p></div>}
        </div>
      </section>
      {selected && (
        <Modal title={selected.inspectionId} onClose={() => setSelected(null)}>
          <div className="modal-result">
            <div className="modal-result-heading"><div><span className="muted-label">Model result</span><h3>{selected.product}</h3></div><StatusBadge status={selected.status} /></div>
            <div className="modal-stats">
              <div><span>Model score</span><strong>{selected.score}/100</strong></div>
              <div><span>Confidence</span><strong>{selected.confidence}%</strong></div>
              <div><span>Decision</span><strong>{selected.decision}</strong></div>
            </div>
            <div className="modal-defects">
              <span className="muted-label">{selected.inspectionType === "Cardboard" ? "Detected classes" : "Predicted condition"}</span>
              {selected.defects.length ? selected.defects.map((defect) => <p key={defect}>{defect}</p>) : <p className="good-text">{selected.condition}</p>}
            </div>
            {selected.detections?.map((detection, index) => (
              <p key={`${detection.label}-${index}`}>{detection.label} · {detection.confidence}% · box ({detection.x.toFixed(0)}, {detection.y.toFixed(0)}, {detection.width.toFixed(0)}, {detection.height.toFixed(0)})</p>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}





