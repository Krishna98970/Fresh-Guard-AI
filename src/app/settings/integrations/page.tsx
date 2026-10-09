'use client';

import React, { useState } from 'react';
import { Key, Database, Sparkles, CheckCircle2, AlertCircle, ExternalLink, Save } from 'lucide-react';
import { store } from '@/lib/db/store';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function IntegrationsSettingsPage() {
  const [geminiKey, setGeminiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/settings/integrations')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          if (data.settings.supabaseUrl) setSupabaseUrl(data.settings.supabaseUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey: geminiKey,
          supabaseUrl,
          supabaseAnonKey: supabaseKey,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestGemini = async () => {
    setTestResult('Testing Gemini Vision connection...');
    try {
      const res = await fetch('/api/inspection/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: 'Honeycrisp Apple',
          imageBase64:
            'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
          geminiApiKey: geminiKey || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult(`Connection Verified! Model: ${data.modelUsed} • Quality Score: ${data.inspection?.overallScore}/100`);
      } else {
        setTestResult(`Note: ${data.error || 'Connection failed'}`);
      }
    } catch {
      setTestResult('Connection check failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Gemini Multimodal Vision API */}
      <Card className="space-y-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Google Gemini 1.5 Vision API</CardTitle>
                <CardDescription>
                  Powers produce optical inspection, defect detection, and quality scoring
                </CardDescription>
              </div>
            </div>
            <Badge variant="cyan" dot>
              Multimodal Vision
            </Badge>
          </div>
        </CardHeader>

        <div className="space-y-3 text-xs max-w-xl">
          <div>
            <label className="block text-slate-400 mb-1">Gemini API Key</label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              You can also specify this in <code className="text-emerald-400">.env.local</code> as{' '}
              <code className="text-emerald-400">GEMINI_API_KEY</code>. If omitted, FreshGuard runs
              its built-in high-precision produce computer vision engine.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
            >
              Get free Gemini API Key from Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>

            <Button size="sm" variant="outline" onClick={handleTestGemini}>
              Test Connection
            </Button>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{testResult}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Supabase Cloud Database */}
      <Card className="space-y-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Supabase PostgreSQL & Storage</CardTitle>
                <CardDescription>
                  Cloud database persistence, Row Level Security, and image bucket storage
                </CardDescription>
              </div>
            </div>
            <Badge variant="slate">Hybrid Ready</Badge>
          </div>
        </CardHeader>

        <form onSubmit={handleSave} className="space-y-3 text-xs max-w-xl">
          <div>
            <label className="block text-slate-400 mb-1">NEXT_PUBLIC_SUPABASE_URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOi..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
            >
              Open Supabase Project Dashboard <ExternalLink className="w-3 h-3" />
            </a>

            <Button type="submit" size="sm" icon={<Save className="w-3 h-3" />}>
              Save Credentials
            </Button>
          </div>

          {saved && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configuration saved successfully</span>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
