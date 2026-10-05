import { inventory, inspections } from "./mockData";
import { inspectImage as runMockInspection } from "./mockAI";
import type { AIResult, Inspection, InspectionType, InventoryItem } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function inspectImage(file: File, inspectionType: InspectionType): Promise<AIResult> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_AI !== "false") return runMockInspection(file, inspectionType);
  const formData = new FormData();
  formData.append("image", file);
  formData.append("inspectionType", inspectionType);
  const response = await fetch(`${API_URL}/api/inspect`, { method: "POST", body: formData });
  if (!response.ok) throw new Error("Inspection request failed");
  return response.json();
}

export async function getInspectionHistory(): Promise<Inspection[]> { return inspections; }
export async function getInventory(): Promise<InventoryItem[]> { return inventory; }
export async function getAnalytics() { return { averageScore: 89.4, freshRate: 87.1, rejectRate: 5.2, totalInspected: 1248 }; }
