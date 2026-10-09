'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  FastForward,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { store } from '@/lib/db/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function DemoController() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([
    'FreshGuard AI Demo Engine standby. Click Run E2E Flow or choose a step below.',
  ]);

  const steps = [
    { num: 1, title: 'Create Order', route: '/dashboard/orders', action: 'CREATE_ORDER' },
    { num: 2, title: 'Allocate Produce', route: '/dashboard/products', action: 'ADD_PRODUCTS' },
    { num: 3, title: 'Produce Intake Inspection', route: '/dashboard/inspection', action: 'START_INSPECTION' },
    { num: 4, title: 'AI Multimodal Vision Scan', route: '/dashboard/inspection', action: 'ANALYZE_IMAGE' },
    { num: 5, title: 'Quality Scoring & Defects', route: '/dashboard/inspection', action: 'EVALUATE_DEFECTS' },
    { num: 6, title: 'Decision Engine Approval', route: '/dashboard/inspection', action: 'DECISION_APPROVE' },
    { num: 7, title: 'Handoff to Smart Packing', route: '/dashboard/packing', action: 'PACKING_QUEUE' },
    { num: 8, title: 'Fragility Analysis & Cushioning', route: '/dashboard/packing', action: 'SELECT_PACKAGING' },
    { num: 9, title: 'Mark Packed & Insulated', route: '/dashboard/packing', action: 'COMPLETE_PACKING' },
    { num: 10, title: 'Assign Fleet Rider', route: '/dashboard/deliveries', action: 'ASSIGN_RIDER' },
    { num: 11, title: 'Dispatch & IoT Telemetry', route: '/dashboard/telemetry', action: 'START_TELEMETRY' },
    { num: 12, title: 'Simulate Transit Vibration', route: '/dashboard/telemetry', action: 'VIBRATION_SPIKE' },
    { num: 13, title: 'Cold-Chain Temp Excursion', route: '/dashboard/telemetry', action: 'TEMP_EXCURSION' },
    { num: 14, title: 'Handling Risk Calculation', route: '/dashboard/telemetry', action: 'CALCULATE_RISK' },
    { num: 15, title: 'Trigger Alert Center Violation', route: '/dashboard/alerts', action: 'GENERATE_ALERT' },
    { num: 16, title: 'Mark Delivery Completed', route: '/dashboard/deliveries', action: 'DELIVER_ORDER' },
    { num: 17, title: 'Customer Produce Rating', route: '/dashboard/feedback', action: 'SUBMIT_FEEDBACK' },
    { num: 18, title: 'Real-Time Analytics Sync', route: '/dashboard/analytics', action: 'SYNC_ANALYTICS' },
  ];

  const log = (msg: string) => {
    setLogMessages((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const executeStep = async (stepIndex: number) => {
    setActiveStep(stepIndex + 1);
    const step = steps[stepIndex];

    switch (step.action) {
      case 'CREATE_ORDER': {
        const order = store.createOrder({
          customerName: 'Dr. Alistair Vance',
          customerAddress: '88 Harborview Promenade, Penthouse 4',
          customerPhone: '+1 (555) 749-0182',
          items: [
            {
              id: `item-${Date.now()}-1`,
              orderId: '',
              productId: 'prod-005',
              productName: 'California Sweet Strawberries',
              sku: 'FRU-STR-005',
              category: 'FRUITS',
              quantity: 2,
              unitPrice: 5.99,
              unit: 'boxes',
            },
            {
              id: `item-${Date.now()}-2`,
              orderId: '',
              productId: 'prod-003',
              productName: 'San Marzano Vine Tomatoes',
              sku: 'VEG-TOM-003',
              category: 'VEGETABLES',
              quantity: 1.5,
              unitPrice: 3.89,
              unit: 'kg',
            },
          ],
        });
        log(`Created Order ${order.orderNumber} ($${order.totalAmount}) for Dr. Alistair Vance`);
        router.push('/dashboard/orders');
        break;
      }

      case 'START_INSPECTION':
      case 'ANALYZE_IMAGE':
      case 'EVALUATE_DEFECTS':
      case 'DECISION_APPROVE': {
        const latestOrder = store.getOrders()[0];
        const insp = store.createInspection({
          orderId: latestOrder?.id,
          productId: 'prod-005',
          productName: 'California Sweet Strawberries',
          batchNumber: 'BATCH-STR-DEMO-99',
          inspectorId: 'usr-inspector-01',
          inspectorName: 'Marcus Rivera',
          imageUrl:
            'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
          overallScore: 92,
          freshnessScore: 95,
          appearanceScore: 93,
          ripenessScore: 90,
          riskLevel: 'LOW',
          decision: 'APPROVED',
          defects: [],
          aiExplanation:
            'Gemini Vision confirmed intact calyx, vibrant anthocyanin coloration, zero mycelial growth. Score 92/100.',
          recommendation: 'Batch approved for immediate cold packaging.',
          shelfLifeEstimateDays: 5,
          packagingAdvice: 'Ventilated eco-tray with bio-cushioning pad.',
          isAiGenerated: true,
        });
        log(`Inspection completed for ${insp.productName}: Quality Score 92/100 -> APPROVED.`);
        router.push('/dashboard/inspection');
        break;
      }

      case 'PACKING_QUEUE':
      case 'SELECT_PACKAGING':
      case 'COMPLETE_PACKING': {
        const latestOrder = store.getOrders()[0];
        if (latestOrder) {
          store.createPackingRecord({
            orderId: latestOrder.id,
            orderNumber: latestOrder.orderNumber,
            packerId: 'usr-packer-01',
            packerName: 'Elena Rostova',
            packagingType: 'VENTILATED_ECO_TRAY',
            fragilityLevel: 'EXTREME',
            specialHandlingInstructions: ['Anti-vibration base', 'Keep cooled below 5°C'],
            status: 'PACKED',
          });
          log(`Order ${latestOrder.orderNumber} successfully packed with Ventilated Eco-Tray & sealed.`);
        }
        router.push('/dashboard/packing');
        break;
      }

      case 'ASSIGN_RIDER': {
        const latestOrder = store.getOrders()[0];
        const riders = store.getRiders();
        const rider = riders[0];
        if (latestOrder) {
          const del = store.createDelivery({
            orderId: latestOrder.id,
            orderNumber: latestOrder.orderNumber,
            riderId: rider.id,
            riderName: rider.name,
            customerName: latestOrder.customerName,
            destinationAddress: latestOrder.customerAddress,
            destinationArea: 'Downtown Metro Corridor',
            distanceKm: 4.2,
            status: 'IN_TRANSIT',
            riskLevel: 'LOW',
            dispatchedAt: new Date().toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 15 * 60000).toISOString(),
          });
          log(`Assigned courier ${rider.name} to Order ${del.orderNumber}. Dispatch in transit.`);
        }
        router.push('/dashboard/deliveries');
        break;
      }

      case 'START_TELEMETRY':
      case 'VIBRATION_SPIKE':
      case 'TEMP_EXCURSION':
      case 'CALCULATE_RISK': {
        const del = store.getDeliveries()[0];
        if (del) {
          store.addTelemetryReading(del.id, {
            deliveryId: del.id,
            orderId: del.orderId,
            timestamp: new Date().toISOString(),
            temperatureC: 6.8,
            humidityPercent: 82.0,
            vibrationG: 1.12,
            accelerationG: 0.78,
            speedKmh: 28.5,
            latitude: 37.779,
            longitude: -122.415,
            handlingRisk: 'MEDIUM',
            flaggedAnomaly: 'Vibration excursion on cobblestone section',
          });

          store.addHandlingEvent(del.id, {
            deliveryId: del.id,
            orderId: del.orderId,
            type: 'SPEED_BUMP',
            severity: 'WARNING',
            vibrationG: 1.12,
            temperatureC: 6.8,
            description: 'Abrupt vertical g-force (1.12g) recorded during transit.',
          });
          log(`Virtual IoT Telemetry stream active: Vibration spike (1.12g) detected.`);
        }
        router.push('/dashboard/telemetry');
        break;
      }

      case 'GENERATE_ALERT': {
        const alert = store.createAlert({
          type: 'VIBRATION',
          severity: 'WARNING',
          title: 'Transit Impact Detected: 1.12g',
          message: 'Speed bump impact detected on Rider Alex Vance vehicle. Produce fragility monitoring alert.',
          entityType: 'DELIVERY',
        });
        log(`Alert generated: "${alert.title}" added to central Alert Center.`);
        router.push('/dashboard/alerts');
        break;
      }

      case 'DELIVER_ORDER': {
        const del = store.getDeliveries()[0];
        if (del) {
          store.completeDelivery(del.id);
          log(`Order ${del.orderNumber} safely handed to customer. Delivery marked completed.`);
        }
        router.push('/dashboard/deliveries');
        break;
      }

      case 'SUBMIT_FEEDBACK': {
        const latestOrder = store.getOrders()[0];
        if (latestOrder) {
          store.addFeedback({
            orderId: latestOrder.id,
            orderNumber: latestOrder.orderNumber,
            customerName: latestOrder.customerName,
            rating: 5,
            freshnessRating: 5,
            packagingRating: 5,
            deliverySpeedRating: 4,
            comment:
              'Strawberries arrived in pristine condition! Perfectly chilled with zero damage. AI packing really works.',
            isDamageReported: false,
          });
          log(`Customer submitted 5-Star Quality Feedback for Order ${latestOrder.orderNumber}!`);
        }
        router.push('/dashboard/feedback');
        break;
      }

      case 'SYNC_ANALYTICS': {
        log(`All analytics updated. Quality prevention rate: 98.2%, zero damaged deliveries.`);
        router.push('/dashboard/analytics');
        break;
      }

      default:
        router.push(step.route);
    }
  };

  const runFullWorkflow = async () => {
    setIsRunningAll(true);
    for (let i = 0; i < steps.length; i++) {
      await executeStep(i);
      await new Promise((r) => setTimeout(r, 1200));
    }
    setIsRunningAll(false);
    log('🎉 All 18 Steps of the FreshGuard Quick-Commerce Workflow Completed Successfully!');
  };

  const handleResetData = () => {
    store.resetToSeed();
    setActiveStep(0);
    log('Database restored to initial seed dataset.');
    router.refresh();
  };

  return (
    <div className="relative z-40">
      {/* Floating Demo Trigger Bar */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-teal-950/80 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-emerald-300">DEMO MODE ACTIVE</span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-400">
            Interactive 18-step Quick-Commerce Lifecycle
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={runFullWorkflow}
            loading={isRunningAll}
            icon={<FastForward className="w-3.5 h-3.5" />}
          >
            {isRunningAll ? 'Running E2E...' : 'Auto-Run 18 Steps'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsOpen(!isOpen)}
            icon={isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          >
            {isOpen ? 'Hide Steps' : 'Step-by-Step Panel'}
          </Button>

          <button
            onClick={handleResetData}
            title="Reset Data to Default Seed"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Step-by-Step Controller Drawer */}
      {isOpen && (
        <div className="glass-panel border-b border-emerald-500/20 p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> End-to-End Quick-Commerce Simulation Workflow
              </h4>
              <p className="text-xs text-slate-400">
                Execute any specific phase or observe the automated real-time status transitions
              </p>
            </div>
            <Badge variant="cyan">
              Step {activeStep} of {steps.length}
            </Badge>
          </div>

          {/* Grid of Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 my-3">
            {steps.map((step, idx) => {
              const isPast = activeStep > step.num;
              const isCurrent = activeStep === step.num;
              return (
                <button
                  key={step.num}
                  onClick={() => executeStep(idx)}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : isPast
                      ? 'bg-slate-900/90 border-emerald-500/30 text-slate-300'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-slate-500">#{step.num}</span>
                    {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="font-medium text-[11px] truncate leading-tight">{step.title}</div>
                </button>
              );
            })}
          </div>

          {/* Live Activity Log */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-24 overflow-y-auto space-y-1">
            {logMessages.map((msg, i) => (
              <div key={i} className="leading-relaxed">
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
