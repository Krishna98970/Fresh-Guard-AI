import { inspectImage, InspectionResult, InspectionType } from './mockAI';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(): Record<string, string> {
  const token = typeof window === 'undefined' ? null : localStorage.getItem('freshguard_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function inspectProduce(file: File, previewUrl: string, inspectionType: InspectionType) {
  if (!API_URL) return inspectImage(previewUrl, inspectionType);
  const body = new FormData();
  body.append('image', file);
  body.append('inspection_type', inspectionType === 'batch' ? 'box' : 'single');
  const response = await fetch(`${API_URL}/api/inspections`, { method: 'POST', body, headers: authHeaders() });
  if (!response.ok) throw new Error('Inspection could not be completed');
  const result = await response.json();
  return {
    inspectionId: result.inspection_id,
    product: result.product,
    inspectionType,
    imageUrl: previewUrl,
    condition: result.condition,
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
  } as InspectionResult;
}

export async function getInspectionHistory(): Promise<InspectionResult[]> {
  return [
    { inspectionId: 'FG-10241', product: 'Apple', inspectionType: 'single', imageUrl: '', condition: 'Fresh', confidence: 94.6, qualityScore: 92, grade: 'A', defects: [], decision: 'ACCEPT', timestamp: '2026-09-22T10:42:00Z', employeeId: 'EMP-1001', warehouseId: 'WH-MTH-001' },
    { inspectionId: 'FG-10240', product: 'Tomato', inspectionType: 'batch', imageUrl: '', condition: 'Needs Review', confidence: 91.2, qualityScore: 87, grade: 'B+', defects: ['Surface bruising'], decision: 'REVIEW', timestamp: '2026-09-22T09:18:00Z', employeeId: 'EMP-1002', warehouseId: 'WH-MTH-001' },
    { inspectionId: 'FG-10239', product: 'Orange', inspectionType: 'single', imageUrl: '', condition: 'Rejected', confidence: 97.1, qualityScore: 51, grade: 'C', defects: ['Significant visible damage'], decision: 'REJECT', timestamp: '2026-09-21T16:05:00Z', employeeId: 'EMP-1001', warehouseId: 'WH-MTH-001' },
  ];
}

export async function getInventory() {
  return [
    ['APL-2045', 'Apple', '250 kg', '92%', 'Fresh', 'Active', '16 Sep 2026'],
    ['TOM-8812', 'Tomato', '180 kg', '87%', 'Review', 'Active', '15 Sep 2026'],
    ['ORG-1904', 'Orange', '320 kg', '95%', 'Fresh', 'Active', '14 Sep 2026'],
    ['BAN-7731', 'Banana', '95 kg', '79%', 'Review', 'Hold', '13 Sep 2026'],
  ];
}

export type { InspectionResult };
