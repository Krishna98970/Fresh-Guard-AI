import { apiRequest } from '@/lib/api';

export interface ProduceOrder {
  order_id: string;
  order_number: string;
  tracking_id?: string;
  customer_name: string;
  customer_address: string;
  destination: string;
  items: Array<{ product_name: string; category: string; quantity: number; unit: string }>;
  priority: string;
  inspection_status: string;
  inspection_decision: string | null;
  packing_status: string;
  dispatch_status: string;
  dispatch_id?: string;
  rider_id?: string;
  created_at: string;
}

export interface PackingRecord {
  packing_id: string;
  order_id: string;
  status: string;
  packaging_type: string;
  recommendation: { packaging_type: string; reason: string; source: string };
  checklist: string[];
  completed_at?: string;
}

export interface WarehouseRider {
  rider_id: string;
  employee_id?: string;
  name: string;
  phone: string;
  availability: string;
  is_active: boolean;
}

export interface RiderPerformance {
  total_deliveries: number;
  completed_deliveries: number;
  failed_deliveries: number;
  average_delivery_minutes: number | null;
  handling_score: number | null;
  handling_score_rule: string;
}

export interface DispatchRecord {
  dispatch_id: string;
  order_id: string;
  order_number: string;
  rider_id: string;
  rider_name: string;
  route?: string;
  priority: string;
  status: string;
  integrity_score?: number;
  expected_delivery_at?: string | null;
  dispatched_at?: string;
  delivered_at?: string;
}

export interface LocationRecord {
  latitude: number;
  longitude: number;
  source: 'GPS' | 'DEMO';
  created_at: string;
}

export interface TemperatureRecord {
  temperature_c: number;
  minimum_c: number;
  maximum_c: number;
  status: string;
  source: string;
  created_at: string;
}

export interface TransitEventRecord {
  event_id: string;
  event_type: string;
  severity: string;
  description: string;
  magnitude?: number;
  source: string;
  created_at: string;
}

export interface DeliveryHistory {
  locations: LocationRecord[];
  temperatures: TemperatureRecord[];
  events: TransitEventRecord[];
}

export interface LifecycleAlert {
  alert_id: string;
  category: string;
  severity: string;
  message: string;
  order_id?: string;
  dispatch_id?: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiRequest(path, init);
  return response.json() as Promise<T>;
}

function jsonBody(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export async function fetchOrders(): Promise<ProduceOrder[]> {
  const result = await json<{ data: ProduceOrder[] }>('/api/orders?limit=100');
  return result.data;
}

export async function createOrder(payload: {
  customer_name: string;
  customer_address: string;
  customer_phone?: string;
  priority: string;
  items: Array<{ product_name: string; category: string; quantity: number; unit: string }>;
}): Promise<ProduceOrder> {
  return json('/api/orders', jsonBody('POST', payload));
}

export async function fetchPacking(): Promise<PackingRecord[]> {
  const result = await json<{ data: PackingRecord[] }>('/api/packing');
  return result.data;
}

export async function updatePacking(orderId: string, payload: {
  status: 'IN_PROGRESS' | 'COMPLETED';
  packaging_type?: string;
  checklist: string[];
}): Promise<PackingRecord> {
  return json(`/api/packing/${encodeURIComponent(orderId)}/status`, jsonBody('PATCH', payload));
}

export async function fetchRiders(): Promise<WarehouseRider[]> {
  const result = await json<{ data: WarehouseRider[] }>('/api/riders');
  return result.data;
}

export async function createRider(payload: { name: string; phone: string; employee_id?: string }): Promise<WarehouseRider> {
  return json('/api/riders', jsonBody('POST', payload));
}

export async function updateRider(riderId: string, payload: Partial<Pick<WarehouseRider, 'name' | 'phone' | 'availability' | 'is_active'>>): Promise<WarehouseRider> {
  return json(`/api/riders/${encodeURIComponent(riderId)}`, jsonBody('PATCH', payload));
}

export async function fetchRiderPerformance(riderId: string): Promise<RiderPerformance> {
  return json(`/api/riders/${encodeURIComponent(riderId)}/performance`);
}

export async function fetchDispatches(): Promise<DispatchRecord[]> {
  const result = await json<{ data: DispatchRecord[] }>('/api/dispatch');
  return result.data;
}

export async function fetchEligibleDispatchOrders(): Promise<ProduceOrder[]> {
  const result = await json<{ data: ProduceOrder[] }>('/api/dispatch/eligible');
  return result.data;
}

export async function createDispatch(payload: {
  order_id: string;
  rider_id: string;
  route?: string;
  priority: string;
  expected_delivery_at?: string;
}): Promise<DispatchRecord> {
  return json('/api/dispatch', jsonBody('POST', payload));
}

export async function updateDispatchStatus(dispatchId: string, status: string): Promise<DispatchRecord> {
  return json(`/api/dispatch/${encodeURIComponent(dispatchId)}/status`, jsonBody('PATCH', { status }));
}

export async function fetchDeliveryHistory(dispatchId: string): Promise<DeliveryHistory> {
  return json(`/api/delivery/${encodeURIComponent(dispatchId)}/history`);
}

export async function addDemoLocation(dispatchId: string, latitude: number, longitude: number): Promise<LocationRecord> {
  return json(`/api/delivery/${encodeURIComponent(dispatchId)}/location`, jsonBody('POST', { latitude, longitude, source: 'DEMO' }));
}

export async function addDemoTemperature(dispatchId: string, temperature_c: number): Promise<TemperatureRecord> {
  const query = new URLSearchParams({ dispatch_id: dispatchId });
  return json(`/api/temperature/readings?${query}`, jsonBody('POST', { temperature_c, source: 'DEMO' }));
}

export async function addDemoTransitEvent(dispatchId: string, event_type: string, description: string, magnitude: number): Promise<TransitEventRecord> {
  return json(`/api/transit/${encodeURIComponent(dispatchId)}/events`, jsonBody('POST', {
    event_type,
    description,
    magnitude,
    source: 'DEMO',
  }));
}

export async function fetchLifecycleAlerts(): Promise<LifecycleAlert[]> {
  const result = await json<{ data: LifecycleAlert[] }>('/api/alerts');
  return result.data;
}

export async function acknowledgeLifecycleAlert(alertId: string): Promise<void> {
  await apiRequest(`/api/alerts/${encodeURIComponent(alertId)}/acknowledge`, { method: 'PATCH' });
}

export async function resolveLifecycleAlert(alertId: string): Promise<void> {
  await apiRequest(`/api/alerts/${encodeURIComponent(alertId)}/resolve`, { method: 'PATCH' });
}

export async function fetchTemperatureThresholds(): Promise<Record<string, { min: number; max: number }>> {
  const result = await json<{ thresholds: Record<string, { min: number; max: number }> }>('/api/settings/temperature-thresholds');
  return result.thresholds;
}

export async function saveTemperatureThresholds(thresholds: Record<string, { min: number; max: number }>): Promise<void> {
  await json('/api/settings/temperature-thresholds', jsonBody('PATCH', { thresholds }));
}

export async function fetchCustomerTracking(trackingId: string) {
  return json<{
    order_number: string;
    status: string;
    inspection_status: string;
    packing_status: string;
    expected_delivery_at: string | null;
    delivered_at: string | null;
    location: { latitude: number; longitude: number; source: string } | null;
    feedback_available: boolean;
  }>(`/api/customer/orders/${encodeURIComponent(trackingId)}`);
}

export async function submitCustomerFeedback(trackingId: string, rating: number, comment: string): Promise<void> {
  await json('/api/customer/feedback', jsonBody('POST', { tracking_id: trackingId, rating, comment }));
}

export async function fetchAnalytics(path: 'inspections' | 'deliveries' | 'temperature', from?: string, to?: string) {
  const query = new URLSearchParams();
  if (from) query.set('date_from', from);
  if (to) query.set('date_to', to);
  return json<{ data: Array<Record<string, string | number>> }>(`/api/analytics/${path}${query.size ? `?${query}` : ''}`);
}

export async function downloadInspectionReport(): Promise<void> {
  const response = await apiRequest('/api/reports/export');
  const file = await response.blob();
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = 'freshguard-inspections.csv';
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export async function fetchReportSummary(): Promise<{
  total_inspections: number;
  fresh: number;
  review: number;
  rejected: number;
  average_score: number;
}> {
  return json('/api/reports/summary');
}
