'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Thermometer,
  Gauge,
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { store } from '@/lib/db/store';
import { Delivery, TelemetryReading, HandlingEvent, HandlingEventType } from '@/lib/types';
import {
  PhysicsState,
  createInitialPhysicsState,
  tickPhysics,
} from '@/lib/telemetry/physics-engine';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function TelemetryContent() {
  const searchParams = useSearchParams();
  const requestedDeliveryId = searchParams.get('deliveryId');

  const [deliveries, setDeliveries] = useState<Delivery[]>(() => store.getDeliveries());
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>(() => {
    if (requestedDeliveryId && deliveries.some((d) => d.id === requestedDeliveryId)) {
      return requestedDeliveryId;
    }
    return deliveries[0]?.id || 'del-001';
  });

  const selectedDelivery = deliveries.find((d) => d.id === selectedDeliveryId) || deliveries[0];

  // Physics Simulation State
  const [physicsState, setPhysicsState] = useState<PhysicsState>(() =>
    createInitialPhysicsState(selectedDelivery?.id || 'del-001', selectedDelivery?.orderId || 'ord-881')
  );
  const [isSimulating, setIsSimulating] = useState(true);
  const [chartData, setChartData] = useState<
    { time: string; vibration: number; temp: number; humidity: number; risk: number }[]
  >([]);
  const [recentEvents, setRecentEvents] = useState<HandlingEvent[]>([]);

  // Initialize initial points
  useEffect(() => {
    const initialPoints = Array.from({ length: 12 }, (_, i) => {
      const time = new Date(Date.now() - (12 - i) * 3000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return {
        time,
        vibration: Number((0.24 + Math.random() * 0.12).toFixed(2)),
        temp: Number((3.2 + Math.random() * 0.4).toFixed(1)),
        humidity: Number((86.0 + Math.random() * 2).toFixed(1)),
        risk: 14,
      };
    });
    setChartData(initialPoints);
  }, []);

  // Continuous physics ticker
  useEffect(() => {
    if (!isSimulating || !selectedDelivery) return;

    const interval = setInterval(() => {
      setPhysicsState((prev) => {
        const { nextState, reading, event } = tickPhysics(prev);
        const timeLabel = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        setChartData((history) => [
          ...history.slice(-19),
          {
            time: timeLabel,
            vibration: nextState.vibrationG,
            temp: nextState.temperatureC,
            humidity: nextState.humidityPercent,
            risk: nextState.handlingRiskScore,
          },
        ]);

        if (event) {
          setRecentEvents((evts) => [event, ...evts.slice(0, 8)]);
        }

        return nextState;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating, selectedDelivery]);

  // Inject specific anomaly event
  const handleTriggerAnomaly = (type: HandlingEventType) => {
    setPhysicsState((prev) => {
      const { nextState, reading, event } = tickPhysics(prev, type);
      const timeLabel = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setChartData((history) => [
        ...history.slice(-19),
        {
          time: timeLabel,
          vibration: nextState.vibrationG,
          temp: nextState.temperatureC,
          humidity: nextState.humidityPercent,
          risk: nextState.handlingRiskScore,
        },
      ]);

      if (event) {
        setRecentEvents((evts) => [event, ...evts.slice(0, 8)]);
      }

      return nextState;
    });
  };

  const handleReset = () => {
    if (selectedDelivery) {
      const fresh = createInitialPhysicsState(selectedDelivery.id, selectedDelivery.orderId);
      setPhysicsState(fresh);
      setRecentEvents([]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Simulation Transparency Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" /> Virtual IoT Telemetry & Physics Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulated IoT vibration, cold-chain temperature dynamics, and handling risk computation
          </p>
        </div>

        {/* Master Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isSimulating ? 'secondary' : 'primary'}
            onClick={() => setIsSimulating(!isSimulating)}
            icon={isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          >
            {isSimulating ? 'Pause Simulation' : 'Start Simulation'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Transparency Callout */}
      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse flex-shrink-0" />
          <span>
            <strong>Simulated Telemetry Engine Active:</strong> Generates multi-axis accelerations,
            thermodynamic drift, and vibration spikes in real-time.
          </span>
        </div>
        <Badge variant="cyan" dot>
          2.5s Sample Rate
        </Badge>
      </div>

      {/* Target Delivery Selector */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Monitored Transit Vehicle:</span>
            <select
              value={selectedDeliveryId}
              onChange={(e) => setSelectedDeliveryId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
            >
              {deliveries.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.orderNumber} — Rider: {d.riderName} ({d.destinationArea})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Rider: <strong className="text-white">{selectedDelivery?.riderName}</strong></span>
            <span>Speed: <strong className="text-cyan-300 font-mono">{physicsState.speedKmh} km/h</strong></span>
            <span>Progress: <strong className="text-emerald-400 font-mono">{physicsState.progressPercent}%</strong></span>
          </div>
        </div>
      </Card>

      {/* Live Physics Gauges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gauge 1: Container Temp */}
        <Card hover>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Cold-Chain Temp</span>
            <Thermometer className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {physicsState.temperatureC}°C
            </span>
            <Badge
              variant={
                physicsState.temperatureC > 14
                  ? 'rose'
                  : physicsState.temperatureC > 6
                  ? 'amber'
                  : 'emerald'
              }
              dot
              className="text-[10px]"
            >
              Target: 1.0 - 5.0°C
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Humidity: <span className="font-mono text-slate-300">{physicsState.humidityPercent}%</span>
          </p>
        </Card>

        {/* Gauge 2: Vibration G-Force */}
        <Card hover>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">3-Axis Vibration</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {physicsState.vibrationG}g
            </span>
            <Badge
              variant={
                physicsState.vibrationG > 1.0
                  ? 'rose'
                  : physicsState.vibrationG > 0.6
                  ? 'amber'
                  : 'emerald'
              }
              className="text-[10px]"
            >
              {physicsState.vibrationG > 1.0 ? 'Excursion' : 'Nominal'}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Permissible ceiling: <span className="font-mono text-slate-300">0.70g</span>
          </p>
        </Card>

        {/* Gauge 3: Acceleration / Braking */}
        <Card hover>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">G-Acceleration</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {physicsState.accelerationG}g
            </span>
            <span className="text-xs font-mono text-slate-400">
              {physicsState.speedKmh} km/h
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Lateral tilt stabilized</p>
        </Card>

        {/* Gauge 4: Handling Risk Score */}
        <Card hover>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Handling Risk Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-black font-mono tracking-tight ${
                physicsState.handlingRiskScore > 60
                  ? 'text-rose-400'
                  : physicsState.handlingRiskScore > 30
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {physicsState.handlingRiskScore}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 100</span>
            <Badge
              variant={
                physicsState.handlingRiskScore > 60
                  ? 'rose'
                  : physicsState.handlingRiskScore > 30
                  ? 'amber'
                  : 'emerald'
              }
            >
              {physicsState.handlingRiskScore > 60
                ? 'HIGH'
                : physicsState.handlingRiskScore > 30
                ? 'MEDIUM'
                : 'LOW'}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Deterministic damage risk index</p>
        </Card>
      </div>

      {/* Oscilloscope Real-Time Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Vibration Oscilloscope */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Real-Time Vibration Oscilloscope (g)
              </CardTitle>
              <CardDescription>Live streaming tri-axial g-force telemetry with shock limit</CardDescription>
            </div>
            <span className="font-mono text-xs text-amber-400 font-semibold">
              Live: {physicsState.vibrationG}g
            </span>
          </CardHeader>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 1.6]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1723',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <ReferenceLine
                  y={0.7}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: 'Warning 0.70g', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }}
                />
                <ReferenceLine
                  y={1.2}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  label={{ value: 'Critical 1.20g', fill: '#f43f5e', fontSize: 10, position: 'insideTopLeft' }}
                />
                <Line
                  type="monotone"
                  dataKey="vibration"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  name="Vibration (g)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Cold-Chain Temperature Tracking */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-cyan-400" /> Cold-Chain Temperature Profile (°C)
              </CardTitle>
              <CardDescription>Continuous sensor tracking with 5°C maximum safety threshold</CardDescription>
            </div>
            <span className="font-mono text-xs text-cyan-400 font-semibold">
              Live: {physicsState.temperatureC}°C
            </span>
          </CardHeader>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 20]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1723',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <ReferenceLine
                  y={5.0}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{ value: 'Optimal Max 5°C', fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }}
                />
                <ReferenceLine
                  y={12.0}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  label={{ value: 'Critical Ceiling 12°C', fill: '#f43f5e', fontSize: 10, position: 'insideTopLeft' }}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  name="Temperature (°C)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Anomaly Injections & Real-Time Incident Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Anomaly Injection Triggers */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" /> Interactive Anomaly Injections
              </CardTitle>
              <CardDescription>Trigger simulated telemetry events to test alert & risk detection</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-2.5">
            <button
              onClick={() => handleTriggerAnomaly('SPEED_BUMP')}
              className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition-all group flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Speed Bump Shock Wave
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Injects 1.34g sudden vertical acceleration
                </div>
              </div>
              <Badge variant="amber" className="text-[10px]">
                Trigger
              </Badge>
            </button>

            <button
              onClick={() => handleTriggerAnomaly('HARSH_BRAKE')}
              className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition-all group flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Emergency Braking Deceleration
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Injects -0.92g sharp deceleration force
                </div>
              </div>
              <Badge variant="amber" className="text-[10px]">
                Trigger
              </Badge>
            </button>

            <button
              onClick={() => handleTriggerAnomaly('TEMPERATURE_SPIKE')}
              className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/40 text-left transition-all group flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-rose-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Cold-Chain Seal Thermal Breach
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Spikes cargo temperature to 16.8°C
                </div>
              </div>
              <Badge variant="rose" className="text-[10px]">
                Trigger
              </Badge>
            </button>

            <button
              onClick={() => handleTriggerAnomaly('PROLONGED_DELAY')}
              className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Prolonged Route Delay
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Simulates vehicle stationary in traffic gridlock
                </div>
              </div>
              <Badge variant="cyan" className="text-[10px]">
                Trigger
              </Badge>
            </button>
          </div>
        </Card>

        {/* Right: Handling Analysis & Automated Alert Stream */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Automated Handling Analysis Stream
              </CardTitle>
              <CardDescription>
                Events detected by the telemetry engine and persisted to database
              </CardDescription>
            </div>
            <Badge variant="cyan">
              {recentEvents.length} Anomaly Events
            </Badge>
          </CardHeader>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Vehicle telemetry nominal. Use the triggers on the left to inject speed bumps, harsh brakes, or thermal leaks.
              </div>
            ) : (
              recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 text-xs animate-in fade-in"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={evt.severity === 'CRITICAL' ? 'rose' : 'amber'}>
                        {evt.type}
                      </Badge>
                      <span className="font-semibold text-white">
                        Vib: {evt.vibrationG}g • Temp: {evt.temperatureC}°C
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1">{evt.description}</p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function TelemetryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
          Loading Virtual IoT Telemetry Stream...
        </div>
      }
    >
      <TelemetryContent />
    </React.Suspense>
  );
}
