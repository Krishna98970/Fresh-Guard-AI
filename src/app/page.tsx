'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Scan,
  PackageCheck,
  Truck,
  Activity,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Database,
  BarChart3,
  Thermometer,
  Zap,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'inspection' | 'packing' | 'telemetry'>('inspection');

  return (
    <div className="min-h-screen bg-[#080b0f] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[800px] left-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[1600px] right-10 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 h-16 glass-panel border-b border-white/5 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0d1219] rounded-[11px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            FRESHGUARD <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">AI</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400">
          <a href="#problem" className="hover:text-white transition-colors">Problem</a>
          <a href="#features" className="hover:text-white transition-colors">AI Inspection</a>
          <a href="#packing" className="hover:text-white transition-colors">Smart Packing</a>
          <a href="#telemetry" className="hover:text-white transition-colors">IoT Telemetry</a>
          <a href="#workflow" className="hover:text-white transition-colors">18-Step Workflow</a>
          <a href="#tech" className="hover:text-white transition-colors">Architecture</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard/overview">
            <Button size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Launch Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Next-Generation Quick-Commerce Quality Assurance</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Protect Every Fresh Delivery <br />
          <span className="gradient-text-emerald">With Multimodal AI</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          FreshGuard AI inspects intake produce with Google Gemini Vision, directs intelligent fragility packaging, and monitors live transit IoT telemetry to eliminate damaged deliveries before they reach customers.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard/overview">
            <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>
              Launch Operations Dashboard
            </Button>
          </Link>
          <a href="#workflow">
            <Button size="lg" variant="secondary" icon={<Sparkles className="w-4 h-4 text-cyan-400" />}>
              Explore 18-Step Flow
            </Button>
          </a>
        </div>

        {/* Hero Visual: Interactive Live Dashboard Preview Mockup */}
        <div className="mt-14 max-w-5xl mx-auto glass-card rounded-3xl p-4 sm:p-6 border border-white/10 shadow-2xl relative text-left">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-slate-500 ml-2 font-mono">freshguard.ai/dashboard/overview</span>
            </div>
            <Badge variant="emerald" dot>
              Live Telematics Nominal
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">AI Quality Score</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">94 / 100</div>
              <div className="text-[10px] text-slate-500">Grade A Export Standard</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Batches Inspected</div>
              <div className="text-2xl font-bold text-white font-mono mt-0.5">840 kg</div>
              <div className="text-[10px] text-emerald-400">1.2s avg scan latency</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Damaged Prevented</div>
              <div className="text-2xl font-bold text-cyan-400 font-mono mt-0.5">99.1%</div>
              <div className="text-[10px] text-slate-500">Zero defect leaks</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Fleet</div>
              <div className="text-2xl font-bold text-white font-mono mt-0.5">14 Couriers</div>
              <div className="text-[10px] text-cyan-300">Live IoT telemetry</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300&q=80"
                alt="Produce Sample"
                className="w-20 h-20 rounded-xl object-cover border border-emerald-500/30"
              />
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">Honeycrisp Apples (Select Batch)</span>
                  <Badge variant="emerald" className="text-[9px]">APPROVED</Badge>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Gemini Vision confirmed intact epidermal wax bloom, 95% turgidity, zero bruising. Approved for ventilated eco-tray packaging.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Virtual Telematics
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Chamber Temp</span>
                <span className="text-cyan-300 font-mono">3.4°C (Safe)</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Vibration RMS</span>
                <span className="text-amber-300 font-mono">0.28g (Smooth)</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Handling Risk</span>
                <span className="text-emerald-400 font-mono">LOW (12/100)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: The Problem */}
      <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase font-semibold tracking-wider text-rose-400">
            The Quick-Commerce Produce Crisis
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-2">
            18% of Fresh Deliveries Arrive Damaged
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3">
            Quick-commerce platforms burn millions in customer refunds and brand churn due to subjective human inspection and rough transit conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Scan className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Inconsistent Human Grading</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Warehouse workers inspect thousands of fruits per hour under fatigue. Micro-bruises and internal softening escape manual checks, turning into rot on customer doorsteps.
            </p>
          </Card>

          <Card hover>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <PackageCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">One-Size-Fits-All Packaging</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Delicate heirloom tomatoes and rugged root vegetables are tossed into identical plastic bags. Lacking targeted cushioning leads to crushing and cell rupture.
            </p>
          </Card>

          <Card hover>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Blind Last-Mile Transit</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Once couriers pick up orders, operations teams have zero visibility into cargo temperature spikes, speed bump collisions, or reckless delivery handling.
            </p>
          </Card>
        </div>
      </section>

      {/* Section 2: Features Showcase */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">
            Intelligent Automation
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-2">
            Engineered for Flawless Produce Logistics
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card hover className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Scan className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Google Gemini Multimodal Vision</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sub-second optical inspection detecting bruises, surface lacerations, fungal spores, and ripeness stages with high-confidence Zod-validated outputs.
            </p>
          </Card>

          <Card hover className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Smart Fragility Packing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated packaging recommendations matching produce fragility scores with ventilated eco-trays, cushioned air-cells, and thermal chilled pouches.
            </p>
          </Card>

          <Card hover className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Virtual IoT Telematics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time physics calculation of tri-axial vibration shocks, container thermodynamics, and courier handling scores to catch anomalies mid-transit.
            </p>
          </Card>
        </div>
      </section>

      {/* Section 4: 18-Step Workflow */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs uppercase font-semibold tracking-wider text-cyan-400">
            End-to-End Orchestration
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-2">
            The 18-Step Quick-Commerce Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3">
            Every step is connected to real database logic, Zod validation, and automated state transitions.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {[
            '1. Order Placed',
            '2. Inventory Allocation',
            '3. Intake Inspection',
            '4. Gemini Vision Scan',
            '5. Quality Scoring',
            '6. Decision Clearance',
            '7. Staging Queue',
            '8. Fragility Analysis',
            '9. Packaging Seal',
            '10. Courier Assignment',
            '11. IoT Telematics',
            '12. Shock Detection',
            '13. Thermal Tracking',
            '14. Risk Score Calculation',
            '15. Real-Time Alert',
            '16. Delivery Handover',
            '17. Customer Review',
            '18. Analytics Update',
          ].map((step, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl glass-card border border-white/5 hover:border-emerald-500/30 transition-colors"
            >
              <span className="font-mono text-[10px] text-emerald-400 font-bold block mb-1">
                PHASE {idx + 1}
              </span>
              <span className="font-medium text-white text-[11px] leading-tight block">
                {step.split('. ')[1]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Architecture & Technology */}
      <section id="tech" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Enterprise Stack
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-2">
            Production-Grade Full-Stack Architecture
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <Card className="text-center p-4">
            <div className="font-bold text-white text-sm">Next.js 15</div>
            <div className="text-[11px] text-slate-400 mt-1">App Router & Server Actions</div>
          </Card>
          <Card className="text-center p-4">
            <div className="font-bold text-emerald-400 text-sm">Gemini 1.5 Vision</div>
            <div className="text-[11px] text-slate-400 mt-1">Structured JSON Multimodal</div>
          </Card>
          <Card className="text-center p-4">
            <div className="font-bold text-cyan-400 text-sm">PostgreSQL & RLS</div>
            <div className="text-[11px] text-slate-400 mt-1">Multi-tenant Security Isolation</div>
          </Card>
          <Card className="text-center p-4">
            <div className="font-bold text-amber-400 text-sm">Recharts & Physics</div>
            <div className="text-[11px] text-slate-400 mt-1">Real-time Telemetry Oscilloscopes</div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center relative z-10">
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-emerald-500/30 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Elevate Your Quick-Commerce Quality Assurance
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-3 mb-8">
            Experience the complete 18-step AI inspection and smart packing platform. Zero mock buttons, real state transitions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard/overview">
              <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Launch Live Dashboard
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Sign In with Demo Persona
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">FRESHGUARD AI</span>
            <span>— AI-Powered Quality Assurance for Fresh Delivery</span>
          </div>
          <div>© 2026 FreshGuard Technologies Inc. Enterprise All Rights Reserved.</div>
        </div>
      </footer>
    </div>
  );
}
