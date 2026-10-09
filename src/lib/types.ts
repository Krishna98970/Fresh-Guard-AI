export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'QUALITY_INSPECTOR'
  | 'PACKING_OPERATOR'
  | 'DELIVERY_MANAGER'
  | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  organizationId: string;
  department?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  settings: SystemSettings;
  createdAt: string;
}

export type ProduceCategory =
  | 'FRUITS'
  | 'VEGETABLES'
  | 'LEAFY_GREENS'
  | 'DAIRY'
  | 'BAKERY'
  | 'PERISHABLES';

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  category: ProduceCategory;
  batchNumber: string;
  stock: number;
  unit: string;
  optimalTempMin: number; // in Celsius
  optimalTempMax: number;
  maxVibrationG: number;
  fragilityScore: number; // 1 (sturdy) to 10 (extremely fragile)
  freshnessIndex: number; // 0 to 100
  avgQualityScore: number;
  defectRate: number; // percentage
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  harvestDate: string;
  receivedDate: string;
  initialQuantity: number;
  remainingQuantity: number;
  supplierName: string;
  inspectedStatus: 'PENDING' | 'PASSED' | 'FAILED' | 'PARTIAL';
  shelfLifeDays: number;
}

export type OrderStatus =
  | 'PLACED'
  | 'PROCESSING'
  | 'INSPECTION'
  | 'APPROVED'
  | 'REJECTED'
  | 'PACKING'
  | 'READY'
  | 'ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  category: ProduceCategory;
  quantity: number;
  unitPrice: number;
  unit: string;
  qualityScore?: number;
  inspected?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  organizationId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  qualityStatus: 'PENDING' | 'APPROVED' | 'REVIEW' | 'REJECTED' | 'BYPASSED';
  packingStatus: 'PENDING' | 'IN_PROGRESS' | 'PACKED' | 'FLAGGED';
  deliveryStatus: 'UNASSIGNED' | 'ASSIGNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  riderId?: string;
  riderName?: string;
  handlingRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  deliveryEta?: string;
  completedAt?: string;
}

export type InspectionDecision = 'APPROVED' | 'REVIEW' | 'REJECTED';

export interface DefectFinding {
  id: string;
  type: 'BRUISE' | 'CUT' | 'MOLD' | 'DISCOLORATION' | 'OVERRIPE' | 'DEHYDRATION' | 'PEST_DAMAGE';
  severity: 'MINOR' | 'MODERATE' | 'SEVERE';
  locationDescription: string;
  confidence: number;
}

export interface QualityInspection {
  id: string;
  orderId?: string;
  productId: string;
  productName: string;
  batchNumber: string;
  inspectorId: string;
  inspectorName: string;
  imageUrl: string;
  overallScore: number; // 0 - 100
  freshnessScore: number;
  appearanceScore: number;
  ripenessScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  decision: InspectionDecision;
  defects: DefectFinding[];
  aiExplanation: string;
  recommendation: string;
  shelfLifeEstimateDays: number;
  packagingAdvice: string;
  inspectedAt: string;
  isAiGenerated: boolean;
}

export interface PackingRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  packerId: string;
  packerName: string;
  packagingType: 'CUSHIONED_AIR_CELL' | 'VENTILATED_ECO_TRAY' | 'RIGID_CLAMSHELL' | 'INSULATED_THERMAL_POUCH' | 'STANDARD_CORRUGATED';
  fragilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  specialHandlingInstructions: string[];
  status: 'PACKED' | 'FLAGGED';
  damageReported?: boolean;
  damageNotes?: string;
  packedAt: string;
  createdAt?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'E_BIKE' | 'MOTORBIKE' | 'VAN';
  vehiclePlate: string;
  status: 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE';
  activeDeliveriesCount: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  handlingScore: number; // 0 - 100
  damageIncidents: number;
  avgDeliveryTimeMinutes: number;
  reliabilityScore: number; // percentage
  avatarUrl: string;
  zone: string;
}

export interface TelemetryReading {
  id: string;
  deliveryId: string;
  orderId: string;
  timestamp: string;
  temperatureC: number;
  humidityPercent: number;
  vibrationG: number; // g-force e.g. 0.25g
  accelerationG: number;
  speedKmh: number;
  latitude: number;
  longitude: number;
  handlingRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  flaggedAnomaly?: string;
}

export type HandlingEventType =
  | 'HARSH_BRAKE'
  | 'SPEED_BUMP'
  | 'POTHOLE_IMPACT'
  | 'RAPID_ACCELERATION'
  | 'PROLONGED_DELAY'
  | 'TEMPERATURE_SPIKE'
  | 'EXCESSIVE_VIBRATION';

export interface HandlingEvent {
  id: string;
  deliveryId: string;
  orderId: string;
  timestamp: string;
  type: HandlingEventType;
  severity: 'WARNING' | 'CRITICAL';
  vibrationG: number;
  temperatureC: number;
  description: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  orderNumber: string;
  riderId: string;
  riderName: string;
  customerName: string;
  destinationAddress: string;
  destinationArea: string;
  distanceKm: number;
  status: 'READY_FOR_DISPATCH' | 'IN_TRANSIT' | 'AT_RISK' | 'DELIVERED' | 'FAILED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  dispatchedAt?: string;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  currentTelemetry?: TelemetryReading;
  recentEvents: HandlingEvent[];
  createdAt: string;
}

export type AlertType =
  | 'QUALITY'
  | 'DELIVERY'
  | 'TEMPERATURE'
  | 'VIBRATION'
  | 'DELAY'
  | 'PACKING'
  | 'SYSTEM';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: string;
  organizationId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  entityType: 'ORDER' | 'INSPECTION' | 'DELIVERY' | 'PRODUCT' | 'SYSTEM';
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CustomerFeedback {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  rating: number; // 1 to 5 stars
  freshnessRating: number;
  packagingRating: number;
  deliverySpeedRating: number;
  comment: string;
  isDamageReported: boolean;
  damageDescription?: string;
  createdAt: string;
}

export interface SystemSettings {
  // Quality Thresholds
  approvalScoreMin: number; // Default 85
  reviewScoreMin: number;   // Default 70
  // Telemetry Thresholds
  tempWarningC: number;     // e.g. 15
  tempCriticalC: number;    // e.g. 25
  vibrationWarningG: number;// e.g. 0.8
  vibrationCriticalG: number;// e.g. 1.5
  // Integrations
  geminiApiKeyConfigured: boolean;
  geminiApiKey?: string;
  supabaseConfigured: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  simulationIntervalMs: number; // Default 3000ms
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
