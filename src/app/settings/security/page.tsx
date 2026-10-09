'use client';

import React from 'react';
import { Shield, Lock, CheckCircle2, Key, Database, FileCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" /> Security, RLS & Authentication Architecture
          </CardTitle>
          <CardDescription>
            System compliance, PostgreSQL Row Level Security status, and token policies
          </CardDescription>
        </CardHeader>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" /> PostgreSQL Row Level Security (RLS)
              </span>
              <Badge variant="emerald" dot>
                Active
              </Badge>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Every database table enforces multi-tenant organization isolation through PostgreSQL
              RLS policies. No cross-tenant data leakage is permitted.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" /> Server-Side API Secret Protection
              </span>
              <Badge variant="emerald" dot>
                Secured
              </Badge>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Google Gemini Vision API keys and Supabase service role keys are strictly handled
              in server-side Node.js runtimes. Zero secrets are exposed to client-side bundles.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-400" /> Immutable Operations Audit Trail
              </span>
              <Badge variant="cyan">Enabled</Badge>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Every inspection decision, packaging seal, and delivery handoff creates an immutable
              audit record accessible in the Admin command log.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
