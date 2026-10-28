import { inventory } from "./mockData";
import type { AIResult, Inspection, InspectionType, InventoryItem, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchApi(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Cannot reach the FreshGuard API at ${API_URL}. Start the backend and check that it is listening.`);
    }
    throw error;
  }
}

type BackendInspection = {
  inspection_id: string;
  inspection_type: "single" | "box";
  batch_id: string | null;
  product: string;
  condition: string;
  confidence: number;
  quality_score: number;
  grade: string;
  decision: Inspection["decision"];
  defects: string[];
  details: string | null;
  detections: NonNullable<Inspection["detections"]>;
  employee_id: string;
  warehouse_id: string;
  timestamp: string;
};

function authHeaders(): Record<string, string> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("freshguard-access-token");
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  return { Authorization: `Bearer ${token}` };
}

async function errorMessage(response: Response): Promise<string> {
  const responseText = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(responseText);
  } catch {
    return responseText || `Request failed (${response.status})`;
  }
  if (typeof body === "object" && body !== null && "detail" in body) {
    const { detail } = body;
    if (typeof detail === "string") return detail;
    if (
      typeof detail === "object"
      && detail !== null
      && "message" in detail
      && typeof detail.message === "string"
    ) return detail.message;
  }
  return `Request failed (${response.status})`;
}

function mapInspection(record: BackendInspection): Inspection {
  const status: Inspection["status"] = record.decision === "ACCEPT"
    ? "Fresh"
    : record.decision === "REJECT" ? "Rejected" : "Needs Review";
  return {
    inspectionId: record.inspection_id,
    product: record.product,
    batch: record.batch_id ?? "—",
    employee: record.employee_id,
    employeeId: record.employee_id,
    warehouseId: record.warehouse_id,
    score: record.quality_score,
    status,
    condition: record.condition,
    confidence: record.confidence,
    grade: record.grade,
    decision: record.decision,
    defects: record.defects,
    details: record.details,
    detections: record.detections,
    timestamp: new Date(record.timestamp).toLocaleString(),
    inspectionType: record.inspection_type === "box" ? "Cardboard" : "Single Produce",
  };
}

export async function loginToBackend(warehouseId: string, employeeId: string, password: string) {
  const response = await fetchApi(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ warehouse_id: warehouseId, employee_id: employeeId, password }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));

  const result: {
    access_token: string;
    user: { employee_id: string; name: string; warehouse_id: string; role: string };
  } = await response.json();
  const user: User = {
    name: result.user.name,
    employeeId: result.user.employee_id,
    role: result.user.role,
    warehouseId: result.user.warehouse_id,
  };
  return { accessToken: result.access_token, user };
}

export async function inspectImage(file: File, inspectionType: InspectionType): Promise<AIResult> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("inspection_type", inspectionType === "Cardboard" ? "box" : "single");
  const response = await fetchApi(`${API_URL}/api/inspections`, {
    method: "POST",
    body: formData,
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  const result: BackendInspection = await response.json();
  return { ...mapInspection(result), imageUrl: URL.createObjectURL(file) };
}

export async function getInspectionHistory(): Promise<Inspection[]> {
  const inspections: Inspection[] = [];
  let page = 1;
  let total = 0;
  do {
    const response = await fetchApi(`${API_URL}/api/inspections?page=${page}&limit=100`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await errorMessage(response));
    const result: { data: BackendInspection[]; total: number } = await response.json();
    inspections.push(...result.data.map(mapInspection));
    total = result.total;
    page += 1;
  } while (inspections.length < total);
  return inspections;
}

export async function getInventory(): Promise<InventoryItem[]> {
  return inventory;
}
