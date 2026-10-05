import type { Inspection, InventoryItem, User } from "./types";

export const demoUser: User = { name: "Krishna Mishra", employeeId: "EMP-1001", role: "Warehouse Employee", warehouseId: "WH-MTH-001" };

export const inspections: Inspection[] = [
  { inspectionId: "FG-10241", product: "Apple", batch: "APL-2045", employee: "Krishna Mishra", employeeId: "EMP-1001", warehouseId: "WH-MTH-001", score: 92, status: "Fresh", condition: "Fresh", confidence: 94.6, grade: "A", decision: "ACCEPT", defects: [], timestamp: "Today, 10:42 AM", inspectionType: "Single Produce" },
  { inspectionId: "FG-10240", product: "Tomato", batch: "TOM-1160", employee: "Arjun Patel", employeeId: "EMP-1002", warehouseId: "WH-MTH-001", score: 78, status: "Needs Review", condition: "Minor surface damage", confidence: 88.2, grade: "B", decision: "REVIEW", defects: ["Surface bruising detected"], timestamp: "Today, 10:18 AM", inspectionType: "Box / Batch", detectedItems: 20, freshItems: 16, damagedItems: 3, rejectedItems: 1 },
  { inspectionId: "FG-10239", product: "Orange", batch: "ORG-8831", employee: "Neha Singh", employeeId: "EMP-1003", warehouseId: "WH-DEL-002", score: 96, status: "Fresh", condition: "Fresh", confidence: 97.1, grade: "A", decision: "ACCEPT", defects: [], timestamp: "Today, 9:54 AM", inspectionType: "Single Produce" },
  { inspectionId: "FG-10238", product: "Banana", batch: "BAN-3012", employee: "Krishna Mishra", employeeId: "EMP-1001", warehouseId: "WH-MTH-001", score: 54, status: "Rejected", condition: "Significant visible damage", confidence: 91.3, grade: "C", decision: "REJECT", defects: ["Discoloration detected", "Significant visible damage"], timestamp: "Today, 9:31 AM", inspectionType: "Single Produce" },
  { inspectionId: "FG-10237", product: "Potato", batch: "POT-6620", employee: "Arjun Patel", employeeId: "EMP-1002", warehouseId: "WH-MTH-001", score: 86, status: "Fresh", condition: "Fresh", confidence: 90.4, grade: "A", decision: "ACCEPT", defects: [], timestamp: "Yesterday, 4:12 PM", inspectionType: "Box / Batch", detectedItems: 30, freshItems: 27, damagedItems: 2, rejectedItems: 1 },
];

export const inventory: InventoryItem[] = [
  { batchId: "APL-2045", product: "Apple", quantity: "250 kg", warehouse: "WH-MTH-001", quality: 92, status: "Active", received: "16 Sep 2026" },
  { batchId: "TOM-1160", product: "Tomato", quantity: "180 kg", warehouse: "WH-MTH-001", quality: 78, status: "Review", received: "15 Sep 2026" },
  { batchId: "ORG-8831", product: "Orange", quantity: "320 kg", warehouse: "WH-DEL-002", quality: 96, status: "Active", received: "15 Sep 2026" },
  { batchId: "BAN-3012", product: "Banana", quantity: "90 kg", warehouse: "WH-MTH-001", quality: 54, status: "Quarantined", received: "14 Sep 2026" },
  { batchId: "POT-6620", product: "Potato", quantity: "500 kg", warehouse: "WH-MTH-001", quality: 86, status: "Active", received: "14 Sep 2026" },
];

export const notifications = [
  { title: "New inspection completed", detail: "FG-10241 was accepted.", time: "2m ago" },
  { title: "Batch requires review", detail: "TOM-1160 has visible bruising.", time: "24m ago" },
  { title: "Weekly report ready", detail: "Your warehouse summary is available.", time: "1h ago" },
];
