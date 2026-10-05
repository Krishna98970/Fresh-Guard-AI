"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImageUpload() {
  const [fileName, setFileName] = useState("");
  const router = useRouter();
  return <div className="upload-box"><label htmlFor="produce-image"><span className="upload-icon">＋</span><strong>{fileName || "Choose an image"}</strong><small>JPG, PNG or WEBP / up to 10 MB</small></label><input id="produce-image" type="file" accept="image/*" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} /><button disabled={!fileName} onClick={() => router.push("/result")}>Run inspection <span>↗</span></button><style>{`.inspect-page { padding:80px 0; } .inspect-page h1, .result-page h1 { font-size:clamp(3rem,7vw,6rem); line-height:.92; letter-spacing:-.06em; } .lede { color:var(--muted); max-width:470px; line-height:1.6; margin:24px 0 44px; } .upload-box { max-width:720px; border-top:1px solid var(--ink); } .upload-box label { min-height:230px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; border:1px dashed #9faea1; cursor:pointer; } .upload-box input { display:none; } .upload-box small { color:var(--muted); } .upload-icon { font-size:2rem; color:var(--leaf); } .upload-box button { width:100%; margin-top:14px; padding:16px; border:0; background:var(--ink); color:white; font:inherit; font-weight:700; cursor:pointer; } .upload-box button:disabled { opacity:.4; cursor:not-allowed; }`}</style></div>;
}
