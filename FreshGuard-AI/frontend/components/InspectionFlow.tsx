"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Camera, Check, FileImage, LoaderCircle, Sparkles, Upload, X } from "lucide-react";
import { inspectImage } from "@/lib/api";
import type { AIResult, InspectionType } from "@/lib/types";
import InspectionResult from "./InspectionResult";

export default function InspectionFlow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<InspectionType>("Single Produce");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState("");

  function acceptFile(nextFile?: File) {
    setError("");
    if (!nextFile) return;
    if (!nextFile.type.match(/image\/(jpeg|png|webp)/)) {
      setError("Invalid file. Please upload JPG, PNG or WEBP.");
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum file size is 10 MB.");
      return;
    }
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setResult(null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    acceptFile(event.dataTransfer.files[0]);
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0]);
  }

  function removeFile() {
    setFile(null);
    setPreview("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function runInspection() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      setResult(await inspectImage(file, type));
    } catch (inspectionError) {
      setError(inspectionError instanceof Error ? inspectionError.message : "Inspection could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="inspection-loading panel">
        <div className="loading-icon"><Sparkles size={23} /></div>
        <h2>Analyzing image...</h2>
        <p>The selected model is inspecting the image.</p>
        <div className="progress-line"><span /></div>
        <div className="loading-steps">
          <span className="done"><Check size={15} /> Image uploaded</span>
          <span className="current"><LoaderCircle size={15} /> Running model inference</span>
        </div>
      </div>
    );
  }

  if (result) return <InspectionResult result={result} preview={preview} onNew={removeFile} />;

  return (
    <div className="inspection-flow">
      <div className="inspection-type">
        <span>Model to use</span>
        <button className={type === "Single Produce" ? "selected" : ""} onClick={() => setType("Single Produce")}>
          <span className="radio-dot" /> Produce (apples, bananas, oranges)
        </button>
        <button className={type === "Cardboard" ? "selected" : ""} onClick={() => setType("Cardboard")}>
          <span className="radio-dot" /> Cardboard detector
        </button>
      </div>
      <div className={`upload-layout ${file ? "has-file" : ""}`}>
        {file ? (
          <div className="image-preview panel">
            <div className="preview-label">
              <span><FileImage size={16} /> Image preview</span>
              <button className="icon-button" aria-label="Remove image" onClick={removeFile}><X size={18} /></button>
            </div>
            <Image src={preview} alt="Selected inspection image" width={700} height={350} unoptimized />
            <div className="file-meta">
              <strong>{file.name}</strong>
              <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        ) : (
          <div className="upload-zone panel" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
            <div className="upload-symbol"><Camera size={24} /></div>
            <h2>Upload {type === "Cardboard" ? "cardboard" : "produce"} image</h2>
            <p>Drag and drop an image here, or choose a file from this device.</p>
            <button className="button button-secondary" onClick={() => inputRef.current?.click()}>
              <Upload size={17} /> Choose image
            </button>
            <small>JPG, PNG or WEBP · Maximum 10 MB</small>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} />
          </div>
        )}
        <div className="inspection-side panel">
          <div className="side-icon"><Sparkles size={20} /></div>
          <p className="eyebrow">AI inspection</p>
          <h2>{file ? "Ready to inspect" : "Start with an image"}</h2>
          <p>{file ? "Run the selected model on this image." : "Choose a model, then upload an image to inspect."}</p>
          {file && (
            <button className="button button-primary full-width" onClick={runInspection}>
              <Sparkles size={17} /> Run AI inspection
            </button>
          )}
          <div className="privacy-note"><span className="mini-shield">✓</span> The selected model analyzes this image.</div>
        </div>
      </div>
      {error && (
        <div className="inline-error">
          <AlertTriangle size={17} /> {error}
          <button onClick={() => setError("")} aria-label="Dismiss error"><X size={15} /></button>
        </div>
      )}
      <div className="inspection-note">
        <AlertTriangle size={16} />
        <div>
          <strong>Model coverage</strong>
          <p>
            The produce model recognizes fresh or rotten apples, bananas, and oranges. The cardboard model
            reports detected objects by numeric class ID; it does not assign cardboard quality grades.
          </p>
        </div>
      </div>
    </div>
  );
}
<<<<<<< HEAD
function ShieldMark() { return <span className="mini-shield">✓</span>; }

=======
>>>>>>> f1596003 (Update FreshGuard AI)
