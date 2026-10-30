'use client';

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, Check, ImagePlus, RefreshCw, ShieldCheck, Upload, X } from 'lucide-react';
import { FreshGuardShell } from '@/components/freshguard-shell';
import { inspectProduce } from '@/lib/api';
import type { InspectionResult, InspectionType } from '@/lib/mockAI';

export default function InspectPage() {
  const [type, setType] = useState<InspectionType>('single');
  const [image, setImage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const linkedOrderId = new URLSearchParams(window.location.search).get('orderId');
    if (!linkedOrderId) return;
    const timerId = window.setTimeout(() => setOrderId(linkedOrderId), 0);
    return () => window.clearTimeout(timerId);
  }, []);

  const selectFile = (selected?: File) => {
    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('Please upload a JPG, PNG or WEBP image.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('Maximum file size is 10 MB.');
      return;
    }
    setError('');
    setResult(null);
    setFile(selected);
    setImage(URL.createObjectURL(selected));
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0]);
  };

  const runInspection = async () => {
    if (!file || !image) return;
    setLoading(true);
    setError('');
    try {
      setResult(await inspectProduce(file, image, type, orderId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Inspection could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    if (image) URL.revokeObjectURL(image);
    setImage('');
    setFile(null);
    setResult(null);
    setError('');
  };

  return (
    <FreshGuardShell>
      <div className="mx-auto max-w-5xl space-y-7">
        <div>
          <p className="mb-2 text-sm font-semibold text-emerald-700">Quality control</p>
          <h1 className="text-3xl font-bold tracking-tight">Produce quality inspection</h1>
          <p className="mt-2 text-slate-500">The configured model inspects the image and persists the result to the warehouse API.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 rounded-xl bg-slate-100 p-1 sm:w-fit">
            {(['single', 'batch'] as const).map((inspectionType) => (
              <button
                key={inspectionType}
                onClick={() => { setType(inspectionType); setResult(null); }}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${type === inspectionType ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
              >
                {inspectionType === 'single' ? 'Single produce' : 'Box / batch'}
              </button>
            ))}
          </div>
          <label className="text-sm font-semibold text-slate-600">
            Link to order (optional)
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Paste order ID"
              className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2 font-normal"
            />
          </label>
        </div>

        {!image ? (
          <div onDrop={onDrop} onDragOver={(event) => event.preventDefault()} className="rounded-2xl border-2 border-dashed border-emerald-200 bg-white px-6 py-16 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><ImagePlus size={30} /></span>
            <h2 className="mt-5 text-lg font-bold">Upload {type === 'batch' ? 'box or batch' : 'produce'} image</h2>
            <p className="mt-2 text-sm text-slate-500">Drag and drop an image here, or choose a file.</p>
            <button onClick={() => input.current?.click()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"><Upload size={17} />Choose image</button>
            <p className="mt-4 text-xs text-slate-400">JPG, PNG, WEBP · Maximum 10 MB</p>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => selectFile(event.target.files?.[0])} />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
              <Image src={image} alt="Uploaded produce" fill unoptimized sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              <button onClick={clearImage} className="absolute right-4 top-4 rounded-lg bg-white/90 p-2 text-slate-700 shadow" aria-label="Remove image"><X size={18} /></button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold">{result ? 'Inspection result' : loading ? 'Analyzing image…' : 'Ready to inspect'}</h2>
              {loading ? (
                <div className="mt-8 space-y-5">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-500" /></div>
                  {['Image uploaded', 'Running configured model', 'Saving inspection result'].map((step, index) => <p key={step} className="flex items-center gap-3 text-sm"><span className={`flex h-6 w-6 items-center justify-center rounded-full ${index < 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{index < 2 ? <Check size={14} /> : '·'}</span>{step}</p>)}
                </div>
              ) : result ? (
                <Result result={result} />
              ) : (
                <>
                  <p className="mt-2 text-sm text-slate-500">Prediction labels and confidence depend on the trained model classes supported by the backend.</p>
                  <button onClick={runInspection} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700">Run AI inspection <ShieldCheck size={18} /></button>
                </>
              )}
            </div>
          </div>
        )}

        {error && <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"><AlertTriangle size={18} />{error}</div>}
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500"><strong className="text-slate-800">Inspection note:</strong> The configured produce model supports only its trained classes. Hidden internal defects may require specialized NIR or hyperspectral imaging.</div>
      </div>
    </FreshGuardShell>
  );
}

function Result({ result }: { result: InspectionResult }) {
  const decisionStyle = result.decision === 'ACCEPT'
    ? 'bg-emerald-50 text-emerald-700'
    : result.decision === 'REJECT'
      ? 'bg-rose-50 text-rose-700'
      : 'bg-amber-50 text-amber-700';

  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-[10px] border-emerald-100 text-emerald-700"><strong className="text-2xl">{result.qualityScore}</strong><small className="text-[10px]">/100</small></div>
        <div><p className="text-sm text-slate-500">Predicted product</p><h3 className="text-xl font-bold">{result.product}</h3><span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${decisionStyle}`}>{result.decision}</span></div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Condition</span><strong className="mt-1 block">{result.condition}</strong></div>
        <div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Model confidence</span><strong className="mt-1 block">{result.confidence}%</strong></div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-bold">Model-reported issues</h4>
        {result.defects.length ? result.defects.map((defect) => <p key={defect} className="mb-2 flex gap-2 text-sm text-slate-600"><Check size={17} className="shrink-0 text-emerald-600" />{defect}</p>) : <p className="text-sm text-slate-500">No model-reported defects.</p>}
      </div>
      <div className="rounded-xl bg-emerald-50 p-3 text-center text-sm font-bold text-emerald-700">Inspection {result.inspectionId} persisted to the warehouse database.</div>
      <button onClick={() => window.location.reload()} className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500"><RefreshCw size={15} />Inspect another image</button>
    </div>
  );
}
