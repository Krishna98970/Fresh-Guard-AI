'use client';

export type InspectionType = 'single' | 'batch';
export type Decision = 'ACCEPT' | 'REVIEW' | 'REJECT';

export interface InspectionResult {
  inspectionId: string;
  product: string;
  inspectionType: InspectionType;
  imageUrl: string;
  condition: 'Fresh' | 'Needs Review' | 'Rejected';
  confidence: number;
  qualityScore: number;
  grade: string;
  defects: string[];
  decision: Decision;
  timestamp: string;
  employeeId: string;
  warehouseId: string;
  totalItems?: number;
  freshItems?: number;
  damagedItems?: number;
  rejectedItems?: number;
}

export async function inspectImage(imageUrl: string, inspectionType: InspectionType): Promise<InspectionResult> {
  await new Promise((resolve) => setTimeout(resolve, 2200));
  const isBatch = inspectionType === 'batch';
  return {
    inspectionId: `FG-${Math.floor(10000 + Math.random() * 89999)}`,
    product: isBatch ? 'Tomatoes' : 'Apple',
    inspectionType,
    imageUrl,
    condition: isBatch ? 'Needs Review' : 'Fresh',
    confidence: isBatch ? 91.2 : 94.6,
    qualityScore: isBatch ? 87 : 92,
    grade: isBatch ? 'B+' : 'A',
    defects: isBatch ? ['Surface bruising detected', '3 items need manual review'] : ['No major visible defect detected', 'Good external appearance', 'Color condition acceptable'],
    decision: isBatch ? 'REVIEW' : 'ACCEPT',
    timestamp: new Date().toISOString(),
    employeeId: 'EMP-1001',
    warehouseId: 'WH-MTH-001',
    ...(isBatch ? { totalItems: 20, freshItems: 16, damagedItems: 3, rejectedItems: 1 } : {}),
  };
}
