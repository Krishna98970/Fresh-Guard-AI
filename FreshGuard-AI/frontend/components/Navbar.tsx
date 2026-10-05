import Link from "next/link";

export default function Navbar() {
  return <header className="nav"><Link className="brand" href="/">FreshGuard<span>AI</span></Link><nav><Link href="/inspect">Inspect</Link><Link href="/result">Latest result</Link></nav><style>{`.nav { height:76px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; padding:0 max(20px, calc((100% - 1120px)/2)); } .brand { font-family:'Space Grotesk'; font-weight:700; font-size:1.3rem; } .brand span { color:var(--leaf); } nav { display:flex; gap:26px; color:var(--muted); font-size:.9rem; } nav a:hover { color:var(--ink); }`}</style></header>;
}
