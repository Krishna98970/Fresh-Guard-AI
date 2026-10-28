export type Status = "Fresh" | "Needs Review" | "Rejected";
export type Decision = "ACCEPT" | "REVIEW" | "REJECT";
export type InspectionType = "Single Produce" | "Cardboard";

export type Inspection = {
  inspectionId: string;
  product: string;
  batch: string;
  employee: string;
  employeeId: string;
  warehouseId: string;
  score: number;
  status: Status;
  condition: string;
  confidence: number;
  grade: string;
  decision: Decision;
  defects: string[];
  details?: string | null;
  detections?: { label: string; confidence: number; x: number; y: number; width: number; height: number }[];
  imageUrl?: string;
  timestamp: string;
  inspectionType: InspectionType;
  detectedItems?: number;
  freshItems?: number;
  damagedItems?: number;
  rejectedItems?: number;
};

export type InventoryItem = {
  batchId: string;
  product: string;
  quantity: string;
  warehouse: string;
  quality: number;
  status: "Active" | "Review" | "Quarantined";
  received: string;
};

export type User = {
  name: string;
  employeeId: string;
  role: string;
  warehouseId: string;
};

export type AIResult = Omit<Inspection, "inspectionId" | "batch" | "employee" | "employeeId" | "warehouseId"> & { inspectionId?: string };
