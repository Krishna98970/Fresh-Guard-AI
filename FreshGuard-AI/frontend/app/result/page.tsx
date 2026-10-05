import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";

export default function ResultPage() { return <div className="content-stack empty-result"><div className="panel empty-state"><ClipboardCheck size={30} /><h1>No active inspection</h1><p>Run a new inspection to see its AI-based visual quality result here.</p><Link className="button button-primary" href="/inspect">Start inspection</Link><Link className="quiet-link" href="/dashboard"><ArrowLeft size={15} /> Back to dashboard</Link></div></div>; }
