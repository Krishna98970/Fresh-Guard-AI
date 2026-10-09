import {
  Product,
  Order,
  QualityInspection,
  Rider,
  Delivery,
  Alert,
  CustomerFeedback,
  SystemSettings,
  AuditLog,
  User,
  Organization,
  OrderStatus,
  InspectionDecision,
  TelemetryReading,
  HandlingEvent,
  PackingRecord,
} from '@/lib/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_INSPECTIONS,
  INITIAL_RIDERS,
  INITIAL_DELIVERIES,
  INITIAL_ALERTS,
  INITIAL_FEEDBACK,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_ORGANIZATION,
} from './seed-data';

export interface FreshGuardState {
  organization: Organization;
  users: User[];
  products: Product[];
  orders: Order[];
  inspections: QualityInspection[];
  packingRecords: PackingRecord[];
  deliveries: Delivery[];
  riders: Rider[];
  alerts: Alert[];
  feedback: CustomerFeedback[];
  settings: SystemSettings;
  auditLogs: AuditLog[];
}

class FreshGuardStore {
  private state: FreshGuardState;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): FreshGuardState {
    return {
      organization: { ...INITIAL_ORGANIZATION },
      users: [...INITIAL_USERS],
      products: [...INITIAL_PRODUCTS],
      orders: [...INITIAL_ORDERS],
      inspections: [...INITIAL_INSPECTIONS],
      packingRecords: [
        {
          id: 'pack-001',
          orderId: 'ord-881',
          orderNumber: 'FG-2026-881',
          packerId: 'usr-packer-01',
          packerName: 'Elena Rostova',
          packagingType: 'VENTILATED_ECO_TRAY',
          fragilityLevel: 'EXTREME',
          specialHandlingInstructions: ['Keep upright', 'Thermal chilled pouch enclosed'],
          status: 'PACKED',
          packedAt: new Date(Date.now() - 18 * 60000).toISOString(),
          createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
        },
      ],
      deliveries: [...INITIAL_DELIVERIES],
      riders: [...INITIAL_RIDERS],
      alerts: [...INITIAL_ALERTS],
      feedback: [...INITIAL_FEEDBACK],
      settings: { ...INITIAL_SETTINGS },
      auditLogs: [...INITIAL_AUDIT_LOGS],
    };
  }

  public resetToSeed(): void {
    this.state = this.getInitialState();
    this.logAudit('usr-admin-01', 'Sarah Chen', 'SYSTEM_RESET', 'DATABASE', 'ALL', {
      reason: 'User manual seed reset',
    });
  }

  // --- Audit Logs ---
  public logAudit(
    userId: string,
    userName: string,
    action: string,
    entity: string,
    entityId: string,
    metadata?: Record<string, any>
  ): void {
    const entry: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      action,
      entity,
      entityId,
      metadata,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(entry);
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs.pop();
    }
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.state.auditLogs];
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return { ...this.state.settings };
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.state.settings = { ...this.state.settings, ...updates };
    this.logAudit('usr-admin-01', 'Admin', 'SETTINGS_UPDATED', 'SETTINGS', 'SYSTEM', updates);
    return this.getSettings();
  }

  // --- Users & Org ---
  public getUsers(): User[] {
    return [...this.state.users];
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public getOrganization(): Organization {
    return { ...this.state.organization };
  }

  // --- Products ---
  public getProducts(): Product[] {
    return [...this.state.products];
  }

  public getProductById(id: string): Product | undefined {
    return this.state.products.find((p) => p.id === id);
  }

  public addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.products.unshift(newProduct);
    this.logAudit('usr-admin-01', 'Manager', 'PRODUCT_CREATED', 'PRODUCT', newProduct.id, {
      name: newProduct.name,
      sku: newProduct.sku,
    });
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.state.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated = {
      ...this.state.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.state.products[idx] = updated;
    this.logAudit('usr-admin-01', 'Manager', 'PRODUCT_UPDATED', 'PRODUCT', id, updates);
    return updated;
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.state.products.length;
    this.state.products = this.state.products.filter((p) => p.id !== id);
    if (this.state.products.length !== initialLen) {
      this.logAudit('usr-admin-01', 'Manager', 'PRODUCT_DELETED', 'PRODUCT', id);
      return true;
    }
    return false;
  }

  // --- Orders ---
  public getOrders(): Order[] {
    return [...this.state.orders];
  }

  public getOrderById(id: string): Order | undefined {
    return this.state.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  public createOrder(orderData: Partial<Order> & { items: Order['items'] }): Order {
    const orderNumber = `FG-2026-${Math.floor(885 + Math.random() * 900)}`;
    const totalAmount = orderData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      organizationId: this.state.organization.id,
      customerName: orderData.customerName || 'Valued Customer',
      customerAddress: orderData.customerAddress || '742 Evergreen Terrace, Sector 4',
      customerPhone: orderData.customerPhone || '+1 (555) 019-2831',
      items: orderData.items,
      totalAmount: Number(totalAmount.toFixed(2)),
      status: orderData.status || 'PLACED',
      qualityStatus: 'PENDING',
      packingStatus: 'PENDING',
      deliveryStatus: 'UNASSIGNED',
      handlingRisk: 'LOW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.orders.unshift(newOrder);
    this.logAudit('usr-admin-01', 'System', 'ORDER_CREATED', 'ORDER', newOrder.id, {
      orderNumber: newOrder.orderNumber,
      totalAmount: newOrder.totalAmount,
    });
    return newOrder;
  }

  public updateOrderStatus(id: string, status: OrderStatus, extra?: Partial<Order>): Order | null {
    const order = this.state.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (extra) {
      Object.assign(order, extra);
    }
    this.logAudit('usr-admin-01', 'System', 'ORDER_STATUS_CHANGED', 'ORDER', order.id, {
      newStatus: status,
      ...extra,
    });
    return { ...order };
  }

  // --- Inspections ---
  public getInspections(): QualityInspection[] {
    return [...this.state.inspections];
  }

  public getInspectionById(id: string): QualityInspection | undefined {
    return this.state.inspections.find((i) => i.id === id);
  }

  public createInspection(inspection: Omit<QualityInspection, 'id' | 'inspectedAt'>): QualityInspection {
    const newInsp: QualityInspection = {
      ...inspection,
      id: `insp-${Date.now()}`,
      inspectedAt: new Date().toISOString(),
    };
    this.state.inspections.unshift(newInsp);

    // If linked to an order, update order quality status
    if (newInsp.orderId) {
      const order = this.state.orders.find((o) => o.id === newInsp.orderId);
      if (order) {
        order.qualityStatus = newInsp.decision;
        if (newInsp.decision === 'APPROVED') {
          order.status = 'APPROVED';
        } else if (newInsp.decision === 'REJECTED') {
          order.status = 'REJECTED';
        }
        order.updatedAt = new Date().toISOString();
      }
    }

    // Auto-create alert if defect or rejection
    if (newInsp.decision === 'REJECTED') {
      this.createAlert({
        type: 'QUALITY',
        severity: 'CRITICAL',
        title: `Quality Rejection: ${newInsp.productName}`,
        message: `Batch ${newInsp.batchNumber} scored ${newInsp.overallScore}/100. Disqualified for dispatch.`,
        entityType: 'INSPECTION',
        entityId: newInsp.id,
      });
    }

    this.logAudit(
      newInsp.inspectorId,
      newInsp.inspectorName,
      'INSPECTION_COMPLETED',
      'QUALITY_INSPECTION',
      newInsp.id,
      {
        product: newInsp.productName,
        score: newInsp.overallScore,
        decision: newInsp.decision,
      }
    );

    return newInsp;
  }

  public updateInspectionDecision(id: string, decision: InspectionDecision): QualityInspection | null {
    const insp = this.state.inspections.find((i) => i.id === id);
    if (!insp) return null;
    insp.decision = decision;
    if (insp.orderId) {
      const order = this.state.orders.find((o) => o.id === insp.orderId);
      if (order) {
        order.qualityStatus = decision;
        if (decision === 'APPROVED') order.status = 'APPROVED';
        if (decision === 'REJECTED') order.status = 'REJECTED';
      }
    }
    this.logAudit('usr-inspector-01', 'Quality Inspector', 'INSPECTION_DECISION_OVERRIDE', 'QUALITY_INSPECTION', id, {
      newDecision: decision,
    });
    return { ...insp };
  }

  // --- Packing Records ---
  public getPackingRecords(): PackingRecord[] {
    return [...this.state.packingRecords];
  }

  public createPackingRecord(record: Omit<PackingRecord, 'id' | 'packedAt' | 'createdAt'>): PackingRecord {
    const newRecord: PackingRecord = {
      ...record,
      id: `pack-${Date.now()}`,
      packedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.state.packingRecords.unshift(newRecord);

    const order = this.state.orders.find((o) => o.id === record.orderId || o.orderNumber === record.orderNumber);
    if (order) {
      order.packingStatus = record.status;
      if (record.status === 'PACKED') {
        order.status = 'READY';
      }
      order.updatedAt = new Date().toISOString();
    }

    this.logAudit(record.packerId, record.packerName, 'PACKING_COMPLETED', 'PACKING', newRecord.id, {
      orderId: record.orderId,
      packagingType: record.packagingType,
    });

    return newRecord;
  }

  // --- Deliveries & Telemetry ---
  public getDeliveries(): Delivery[] {
    return [...this.state.deliveries];
  }

  public getDeliveryById(id: string): Delivery | undefined {
    return this.state.deliveries.find((d) => d.id === id || d.orderId === id);
  }

  public createDelivery(deliveryData: Omit<Delivery, 'id' | 'createdAt' | 'recentEvents'>): Delivery {
    const newDel: Delivery = {
      ...deliveryData,
      id: `del-${Date.now()}`,
      recentEvents: [],
      createdAt: new Date().toISOString(),
    };
    this.state.deliveries.unshift(newDel);

    // Update order
    const order = this.state.orders.find((o) => o.id === deliveryData.orderId);
    if (order) {
      order.deliveryStatus = 'IN_TRANSIT';
      order.status = 'OUT_FOR_DELIVERY';
      order.riderId = deliveryData.riderId;
      order.riderName = deliveryData.riderName;
      order.updatedAt = new Date().toISOString();
    }

    // Update rider active deliveries
    const rider = this.state.riders.find((r) => r.id === deliveryData.riderId);
    if (rider) {
      rider.activeDeliveriesCount += 1;
      rider.status = 'ON_DELIVERY';
    }

    this.logAudit('usr-delivery-01', 'David Kim', 'DELIVERY_DISPATCHED', 'DELIVERY', newDel.id, {
      orderNumber: newDel.orderNumber,
      riderName: newDel.riderName,
    });

    return newDel;
  }

  public addTelemetryReading(deliveryId: string, reading: Omit<TelemetryReading, 'id'>): TelemetryReading {
    const newReading: TelemetryReading = {
      ...reading,
      id: `tel-${Date.now()}`,
    };
    const delivery = this.state.deliveries.find((d) => d.id === deliveryId);
    if (delivery) {
      delivery.currentTelemetry = newReading;
      delivery.riskLevel = newReading.handlingRisk;

      const order = this.state.orders.find((o) => o.id === delivery.orderId);
      if (order) {
        order.handlingRisk = newReading.handlingRisk;
      }
    }
    return newReading;
  }

  public addHandlingEvent(deliveryId: string, event: Omit<HandlingEvent, 'id' | 'timestamp'>): HandlingEvent {
    const newEvent: HandlingEvent = {
      ...event,
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    const delivery = this.state.deliveries.find((d) => d.id === deliveryId);
    if (delivery) {
      delivery.recentEvents.unshift(newEvent);
      if (delivery.recentEvents.length > 20) delivery.recentEvents.pop();

      // Deduct from rider handling score slightly if severe
      const rider = this.state.riders.find((r) => r.id === delivery.riderId);
      if (rider && event.severity === 'CRITICAL') {
        rider.handlingScore = Math.max(70, Number((rider.handlingScore - 1.5).toFixed(1)));
        rider.damageIncidents += 1;
      }

      // Generate alert
      this.createAlert({
        type: event.type === 'TEMPERATURE_SPIKE' ? 'TEMPERATURE' : 'VIBRATION',
        severity: event.severity,
        title: `Transit Anomaly: ${event.type}`,
        message: `${event.description} (Delivery ${delivery.orderNumber})`,
        entityType: 'DELIVERY',
        entityId: delivery.id,
      });
    }
    return newEvent;
  }

  public completeDelivery(deliveryId: string): Delivery | null {
    const delivery = this.state.deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return null;
    delivery.status = 'DELIVERED';
    delivery.actualDeliveryTime = new Date().toISOString();

    const order = this.state.orders.find((o) => o.id === delivery.orderId);
    if (order) {
      order.status = 'DELIVERED';
      order.deliveryStatus = 'DELIVERED';
      order.completedAt = new Date().toISOString();
      order.updatedAt = new Date().toISOString();
    }

    const rider = this.state.riders.find((r) => r.id === delivery.riderId);
    if (rider) {
      rider.activeDeliveriesCount = Math.max(0, rider.activeDeliveriesCount - 1);
      if (rider.activeDeliveriesCount === 0) {
        rider.status = 'AVAILABLE';
      }
      rider.totalDeliveries += 1;
      rider.successfulDeliveries += 1;
    }

    this.logAudit('usr-delivery-01', 'Delivery Dispatch', 'DELIVERY_COMPLETED', 'DELIVERY', delivery.id, {
      orderNumber: delivery.orderNumber,
    });

    return { ...delivery };
  }

  // --- Riders ---
  public getRiders(): Rider[] {
    return [...this.state.riders];
  }

  public getRiderById(id: string): Rider | undefined {
    return this.state.riders.find((r) => r.id === id);
  }

  // --- Alerts ---
  public getAlerts(): Alert[] {
    return [...this.state.alerts];
  }

  public createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'isRead' | 'organizationId'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: `alt-${Date.now()}`,
      organizationId: this.state.organization.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.state.alerts.unshift(newAlert);
    return newAlert;
  }

  public markAlertAsRead(id: string): boolean {
    const alert = this.state.alerts.find((a) => a.id === id);
    if (alert) {
      alert.isRead = true;
      return true;
    }
    return false;
  }

  public markAllAlertsAsRead(): void {
    this.state.alerts.forEach((a) => {
      a.isRead = true;
    });
  }

  // --- Feedback ---
  public getFeedback(): CustomerFeedback[] {
    return [...this.state.feedback];
  }

  public addFeedback(fb: Omit<CustomerFeedback, 'id' | 'createdAt'>): CustomerFeedback {
    const newFb: CustomerFeedback = {
      ...fb,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.feedback.unshift(newFb);

    if (newFb.isDamageReported) {
      this.createAlert({
        type: 'QUALITY',
        severity: 'CRITICAL',
        title: `Damage Complaint: Order ${newFb.orderNumber}`,
        message: `Customer ${newFb.customerName} flagged damage: "${newFb.damageDescription || 'Poor quality produce received'}".`,
        entityType: 'ORDER',
        entityId: newFb.orderId,
      });
    }

    this.logAudit('usr-system', 'Customer Portal', 'FEEDBACK_SUBMITTED', 'FEEDBACK', newFb.id, {
      rating: newFb.rating,
      orderNumber: newFb.orderNumber,
    });

    return newFb;
  }
}

// Attach to globalThis in Node/Next to prevent re-instantiation across dev fast-refreshes
const globalForFreshGuard = globalThis as unknown as {
  __freshguard_store__?: FreshGuardStore;
};

export const store = globalForFreshGuard.__freshguard_store__ || new FreshGuardStore();

if (process.env.NODE_ENV !== 'production') {
  globalForFreshGuard.__freshguard_store__ = store;
}
