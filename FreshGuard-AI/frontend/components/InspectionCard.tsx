import Link from "next/link";

export default function InspectionCard() {
  return <div className="inspection-card"><div className="scan-orbit"><div className="produce-mark">◉</div><div className="scan-line" /></div><div className="card-footer"><span>Ready to inspect</span><Link href="/inspect">Open scanner →</Link></div><style>{`.inspection-card { background:#dce8cc; min-height:450px; padding:32px; display:flex; flex-direction:column; justify-content:space-between; } .scan-orbit { flex:1; display:grid; place-items:center; position:relative; border:1px solid rgba(35,122,82,.28); } .produce-mark { font-size:8rem; color:var(--leaf); opacity:.85; } .scan-line { position:absolute; left:13%; right:13%; top:50%; border-top:2px solid var(--lime); box-shadow:0 0 20px var(--lime); } .card-footer { display:flex; justify-content:space-between; gap:20px; padding-top:24px; font-size:.83rem; } .card-footer a { color:var(--leaf); font-weight:700; }`}</style></div>;
}
