import type { InspectionResult, InspectionType } from './mockAI';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

interface InspectionApiRecord {
  inspection_id: string;
  product: string;
  inspection_type: 'single' | 'box';
  decision: InspectionResult['decision'];
  confidence: number;
  quality_score: number;
  grade: string;
  defects: string[];
  timestamp: string;
  employee_id: string;
  warehouse_id: string;
}

function authHeaders(): Record<string, string> {
  const token = typeof window === 'undefined' ? null : localStorage.getItem('freshguard_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest(path: string, init: RequestInit = {}) {
  if (!API_URL) {
    throw new Error('Backend is not configured. Set NEXT_PUBLIC_API_URL to the FastAPI URL.');
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init.headers },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      const detail = body.detail;
      message = typeof detail === 'string' ? detail : detail?.message || message;
    } catch {
      message = `Request failed (${response.status})`;
    }
    throw new Error(message);
  }
  return response;
}

export async function inspectProduce(
  file: File,
  previewUrl: string,
  inspectionType: InspectionType,
  orderId?: string
): Promise<InspectionResult> {
  const body = new FormData();
  body.append('image', file);
  body.append('inspection_type', inspectionType === 'batch' ? 'box' : 'single');
  if (orderId?.trim()) body.append('order_id', orderId.trim());
  const response = await apiRequest('/api/inspections', { method: 'POST', body });
  const result = await response.json();
  return {
    inspectionId: result.inspection_id,
    product: result.product,
    inspectionType,
    imageUrl: previewUrl,
    condition: result.decision === 'ACCEPT'
      ? 'Fresh'
      : result.decision === 'REJECT'
        ? 'Rejected'
        : 'Needs Review',
    confidence: result.confidence,
    qualityScore: result.quality_score,
    grade: result.grade,
    defects: result.defects || [],
    decision: result.decision,
    timestamp: result.timestamp,
    employeeId: result.employee_id,
    warehouseId: result.warehouse_id,
    totalItems: result.total_items,
    freshItems: result.fresh_items,
    damagedItems: result.damaged_items,
    rejectedItems: result.rejected_items,
  };
}

export async function getInspectionHistory(): Promise<InspectionResult[]> {
  const response = await apiRequest('/api/inspections?limit=100');
  const result: { data: InspectionApiRecord[] } = await response.json();
  return result.data.map((record) => ({
    inspectionId: record.inspection_id,
    product: record.product,
    inspectionType: record.inspection_type === 'box' ? 'batch' : 'single',
    imageUrl: '',
    condition: record.decision === 'ACCEPT'
      ? 'Fresh'
      : record.decision === 'REJECT'
        ? 'Rejected'
        : 'Needs Review',
    confidence: record.confidence,
    qualityScore: record.quality_score,
    grade: record.grade,
    defects: record.defects || [],
    decision: record.decision,
    timestamp: record.timestamp,
    employeeId: record.employee_id,
    warehouseId: record.warehouse_id,
  }));
}

export async function getInventory(): Promise<string[][]> {
  const response = await apiRequest('/api/inventory');
  const result: { data: Array<{
    batch_id: string;
    product: string;
    quantity: number;
    unit: string;
    quality_score: number | null;
    status: string;
    received_at: string;
  }> } = await response.json();
  return result.data.map((record) => [
    String(record.batch_id),
    String(record.product),
    `${record.quantity} ${record.unit}`,
    typeof record.quality_score === 'number' ? `${record.quality_score}%` : '—',
    String(record.status),
    String(record.status),
    new Date(String(record.received_at)).toLocaleDateString(),
  ]);
}

export async function createInventory(payload: {
  batch_id: string;
  product: string;
  quantity: number;
  unit: string;
}) {
  const response = await apiRequest('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export interface DashboardMetrics {
  total_inspections: number;
  fresh_count: number;
  review_count: number;
  rejected_count: number;
  fresh_rate: number;
  reject_rate: number;
  average_quality_score: number;
  total_orders: number;
  packing_completed: number;
  ready_for_dispatch: number;
  in_transit: number;
  delivered: number;
  delayed: number;
  temperature_alerts: number;
  transit_alerts: number;
}

export async function getDashboardMetrics(dateFrom?: string, dateTo?: string): Promise<DashboardMetrics> {
  const query = new URLSearchParams();
  if (dateFrom) query.set('date_from', dateFrom);
  if (dateTo) query.set('date_to', dateTo);
  const response = await apiRequest(`/api/analytics/dashboard${query.size ? `?${query}` : ''}`);
  return response.json() as Promise<DashboardMetrics>;
}

export async function getOrders() {
  const response = await apiRequest('/api/orders?limit=100');
  return response.json();
}

export interface WarehouseAlert {
  alert_id: string;
  category: string;
  severity: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

export async function getAlerts(): Promise<WarehouseAlert[]> {
  const response = await apiRequest('/api/alerts');
  const result: { data: WarehouseAlert[] } = await response.json();
  return result.data;
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  await apiRequest(`/api/alerts/${encodeURIComponent(alertId)}/acknowledge`, { method: 'PATCH' });
}

export type { InspectionResult };
