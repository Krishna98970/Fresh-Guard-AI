import { TelemetryReading, HandlingEvent, HandlingEventType } from '@/lib/types';
import { store } from '@/lib/db/store';

export interface PhysicsState {
  deliveryId: string;
  orderId: string;
  temperatureC: number;
  humidityPercent: number;
  vibrationG: number;
  accelerationG: number;
  speedKmh: number;
  latitude: number;
  longitude: number;
  progressPercent: number;
  handlingRiskScore: number; // 0 - 100
}

export function createInitialPhysicsState(deliveryId: string, orderId: string): PhysicsState {
  return {
    deliveryId,
    orderId,
    temperatureC: 3.2,
    humidityPercent: 86.0,
    vibrationG: 0.24,
    accelerationG: 0.08,
    speedKmh: 22.0,
    latitude: 37.7749,
    longitude: -122.4194,
    progressPercent: 15,
    handlingRiskScore: 12,
  };
}

export function tickPhysics(
  current: PhysicsState,
  injectedEvent?: HandlingEventType
): { nextState: PhysicsState; reading: TelemetryReading; event?: HandlingEvent } {
  let temp = current.temperatureC;
  let humidity = current.humidityPercent;
  let vibration = current.vibrationG;
  let accel = current.accelerationG;
  let speed = current.speedKmh;
  let riskScore = current.handlingRiskScore;

  let eventCreated: HandlingEvent | undefined = undefined;

  // Natural physics variations
  const tempDrift = (Math.random() - 0.48) * 0.2;
  temp = Math.max(1.5, Math.min(6.5, Number((temp + tempDrift).toFixed(1))));

  const vibJitter = (Math.random() - 0.5) * 0.08;
  vibration = Math.max(0.12, Math.min(0.55, Number((0.26 + vibJitter).toFixed(2))));

  speed = Math.max(15, Math.min(38, Number((speed + (Math.random() - 0.5) * 4).toFixed(1))));
  accel = Number(((speed - current.speedKmh) / 3.6).toFixed(2));

  // If specific anomaly injected
  if (injectedEvent) {
    switch (injectedEvent) {
      case 'SPEED_BUMP':
      case 'POTHOLE_IMPACT':
        vibration = 1.34;
        riskScore = Math.min(100, riskScore + 28);
        eventCreated = store.addHandlingEvent(current.deliveryId, {
          deliveryId: current.deliveryId,
          orderId: current.orderId,
          type: injectedEvent,
          severity: 'WARNING',
          vibrationG: vibration,
          temperatureC: temp,
          description: `Mechanical shock wave: ${vibration}g impact detected. Risk score elevated.`,
        });
        break;

      case 'HARSH_BRAKE':
        accel = -0.92;
        vibration = 0.88;
        riskScore = Math.min(100, riskScore + 22);
        eventCreated = store.addHandlingEvent(current.deliveryId, {
          deliveryId: current.deliveryId,
          orderId: current.orderId,
          type: 'HARSH_BRAKE',
          severity: 'WARNING',
          vibrationG: vibration,
          temperatureC: temp,
          description: `Rapid negative acceleration (-0.92g). Lateral container shift flagged.`,
        });
        break;

      case 'TEMPERATURE_SPIKE':
        temp = 16.8;
        riskScore = Math.min(100, riskScore + 35);
        eventCreated = store.addHandlingEvent(current.deliveryId, {
          deliveryId: current.deliveryId,
          orderId: current.orderId,
          type: 'TEMPERATURE_SPIKE',
          severity: 'CRITICAL',
          vibrationG: vibration,
          temperatureC: temp,
          description: `Cold-chain seal breach: Cargo temperature rose to ${temp}°C (Safe ceiling: 5°C).`,
        });
        break;

      case 'PROLONGED_DELAY':
        speed = 0;
        riskScore = Math.min(100, riskScore + 15);
        eventCreated = store.addHandlingEvent(current.deliveryId, {
          deliveryId: current.deliveryId,
          orderId: current.orderId,
          type: 'PROLONGED_DELAY',
          severity: 'WARNING',
          vibrationG: vibration,
          temperatureC: temp,
          description: `Vehicle stationary in traffic gridlock for >12 minutes. Shelf life monitoring alert.`,
        });
        break;
    }
  } else {
    // Gradual risk relaxation when smooth
    riskScore = Math.max(8, Number((riskScore * 0.95).toFixed(1)));
  }

  // Determine Handling Risk tier (0-30 LOW, 31-60 MEDIUM, 61-100 HIGH)
  let handlingRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (riskScore > 60 || vibration > 1.2 || temp > 14) {
    handlingRisk = 'HIGH';
  } else if (riskScore > 30 || vibration > 0.7 || temp > 8) {
    handlingRisk = 'MEDIUM';
  }

  const progressPercent = Math.min(100, current.progressPercent + 2);

  const nextState: PhysicsState = {
    deliveryId: current.deliveryId,
    orderId: current.orderId,
    temperatureC: temp,
    humidityPercent: humidity,
    vibrationG: vibration,
    accelerationG: accel,
    speedKmh: speed,
    latitude: current.latitude + 0.0003,
    longitude: current.longitude + 0.0002,
    progressPercent,
    handlingRiskScore: Math.round(riskScore),
  };

  const reading = store.addTelemetryReading(current.deliveryId, {
    deliveryId: current.deliveryId,
    orderId: current.orderId,
    timestamp: new Date().toISOString(),
    temperatureC: temp,
    humidityPercent: humidity,
    vibrationG: vibration,
    accelerationG: accel,
    speedKmh: speed,
    latitude: nextState.latitude,
    longitude: nextState.longitude,
    handlingRisk,
    flaggedAnomaly: eventCreated ? eventCreated.description : undefined,
  });

  return { nextState, reading, event: eventCreated };
}
