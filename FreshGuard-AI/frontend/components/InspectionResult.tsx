"use client";

import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, Check, ChevronLeft, Download, RotateCcw, X } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { AIResult } from "@/lib/types";

export default function InspectionResult({ result, preview, onNew }: { result: AIResult; preview: string; onNew: () => void }) {
  const isCardboard = result.inspectionType === "Cardboard";
  const decisionCopy = isCardboard
    ? "The detector output is saved. Review the detected classes before making a quality decision."
    : result.decision === "ACCEPT"
      ? "The classifier identified this fruit as fresh."
      : "The classifier identified this fruit as rotten.";

  return (
    <div className="result-flow">
      <div className="result-toolbar">
        <button className="back-button" onClick={onNew}><ChevronLeft size={17} /> New inspection</button>
        <span className="result-id">{result.inspectionId ?? "Model inspection"}</span>
      </div>
      <div className="result-grid">
        <div className="result-image panel">
          <div className="preview-label"><span>Inspection image</span><span className="image-time">Just now</span></div>
          {preview ? <Image src={preview} alt="Inspected image" width={700} height={350} unoptimized /> : <div className="image-placeholder">No image preview</div>}
          <div className="image-caption"><strong>{result.product}</strong><span>{result.inspectionType}</span></div>
        </div>
        <div className="result-summary panel">
          <div className="result-summary-top">
            <div><p className="eyebrow">Model result</p><h2>{result.product}</h2></div>
            <StatusBadge status={result.status} />
          </div>
          <div className="score-row">
            <div className="score-ring" style={{ "--score": `${result.score * 3.6}deg` } as React.CSSProperties}>
              <div><strong>{result.score}</strong><span>/100</span></div>
            </div>
            <div className="score-details">
              <span>{isCardboard ? "Mean detection confidence" : "Classifier confidence"}</span>
              <strong>{isCardboard ? "Class detection" : result.condition}</strong>
              <small>{result.confidence}% confidence</small>
            </div>
          </div>
          <div className={`decision-banner decision-${result.decision.toLowerCase()}`}>
            <span className="decision-icon">
              {result.decision === "ACCEPT" ? <Check size={20} /> : result.decision === "REVIEW" ? <AlertTriangle size={20} /> : <X size={20} />}
            </span>
            <div><strong>{result.decision === "REVIEW" ? "Needs review" : result.decision}</strong><p>{decisionCopy}</p></div>
          </div>
          <div className="result-details">
            <div><span>Condition</span><strong>{result.condition}</strong></div>
            {!isCardboard && <div><span>Grade</span><strong>{result.grade}</strong></div>}
          </div>
        </div>
      </div>
      {isCardboard && (
        <section className="batch-result panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Cardboard detections</p><h2>{result.detections?.length ?? 0} objects detected</h2></div>
          </div>
          {result.detections?.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Class ID</th><th>Confidence</th><th>Box (x, y, width, height)</th></tr></thead>
                <tbody>{result.detections.map((detection, index) => (
                  <tr key={`${detection.label}-${index}`}>
                    <td>{detection.label}</td>
                    <td>{detection.confidence}%</td>
                    <td>{[detection.x, detection.y, detection.width, detection.height].map((value) => Math.round(value)).join(", ")}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="defect-item">The detector returned no objects for this image.</p>}
        </section>
      )}
      <div className="defects-grid">
        <div className="panel defects-panel">
          <div className="panel-heading"><div><p className="eyebrow">Model output</p><h2>{isCardboard ? "Detected classes" : "Predicted condition"}</h2></div></div>
          {result.defects.length
            ? result.defects.map((defect) => <p className="defect-item warning" key={defect}><AlertTriangle size={17} />{defect}</p>)
            : <p className="defect-item good"><Check size={17} />The classifier predicted fresh {result.product.toLowerCase()}.</p>}
        </div>
        <div className="panel result-actions">
          <h2>Inspection saved</h2>
          <p>This model result and its image were saved to the backend inspection history.</p>
          <div className="saved-message"><Check size={17} /> Inspection {result.inspectionId} saved successfully</div>
          <Link className="button button-secondary full-width" href="/history"><Download size={17} /> View inspection history</Link>
        </div>
      </div>
      <div className="result-footer">
        <span><AlertTriangle size={15} /> {decisionCopy}</span>
        <button onClick={onNew}><RotateCcw size={15} /> Inspect another</button>
      </div>
    </div>
  );
}
