'use client';

import React, { useState } from 'react';
import { Sliders, Save, CheckCircle2, ShieldCheck, Thermometer, Zap } from 'lucide-react';
import { store } from '@/lib/db/store';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ThresholdsPage() {
  const currentSettings = store.getSettings();

  const [approvalScoreMin, setApprovalScoreMin] = useState(currentSettings.approvalScoreMin);
  const [reviewScoreMin, setReviewScoreMin] = useState(currentSettings.reviewScoreMin);
  const [tempWarningC, setTempWarningC] = useState(currentSettings.tempWarningC);
  const [tempCriticalC, setTempCriticalC] = useState(currentSettings.tempCriticalC);
  const [vibrationWarningG, setVibrationWarningG] = useState(currentSettings.vibrationWarningG);
  const [vibrationCriticalG, setVibrationCriticalG] = useState(currentSettings.vibrationCriticalG);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings({
      approvalScoreMin,
      reviewScoreMin,
      tempWarningC,
      tempCriticalC,
      vibrationWarningG,
      vibrationCriticalG,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="space-y-6">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" /> Inspection & Telemetry Thresholds
          </CardTitle>
          <CardDescription>
            Configure deterministic business rules for automatic produce acceptance and telemetry violations
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSave} className="space-y-6 text-xs max-w-xl">
        {/* Quality Decision Engine Thresholds */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> AI Quality Decision Engine
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">
                Minimum Approval Score ({approvalScoreMin}/100)
              </label>
              <input
                type="range"
                min="75"
                max="95"
                value={approvalScoreMin}
                onChange={(e) => setApprovalScoreMin(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Scores ≥ this are APPROVED</p>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                Minimum Review Score ({reviewScoreMin}/100)
              </label>
              <input
                type="range"
                min="50"
                max="80"
                value={reviewScoreMin}
                onChange={(e) => setReviewScoreMin(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Scores below this are REJECTED</p>
            </div>
          </div>
        </div>

        {/* Telemetry Physics Thresholds */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="w-4 h-4" /> Cold-Chain & Vibration Tripwires
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Temp Warning Limit (°C)</label>
              <input
                type="number"
                step="0.5"
                value={tempWarningC}
                onChange={(e) => setTempWarningC(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Temp Critical Breach (°C)</label>
              <input
                type="number"
                step="0.5"
                value={tempCriticalC}
                onChange={(e) => setTempCriticalC(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 mb-1">Vibration Warning (g-force)</label>
              <input
                type="number"
                step="0.05"
                value={vibrationWarningG}
                onChange={(e) => setVibrationWarningG(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Vibration Shock Limit (g)</label>
              <input
                type="number"
                step="0.05"
                value={vibrationCriticalG}
                onChange={(e) => setVibrationCriticalG(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Button type="submit" icon={<Save className="w-3.5 h-3.5" />}>
            Save Operational Thresholds
          </Button>
          {saved && (
            <span className="text-emerald-400 flex items-center gap-1 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Thresholds Updated
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
