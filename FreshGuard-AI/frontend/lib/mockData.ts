import type { InventoryItem, User } from "./types";

export const demoUser: User = { name: "Krishna Mishra", employeeId: "EMP-1001", role: "Warehouse Employee", warehouseId: "WH-MTH-001" };

export const inventory: InventoryItem[] = [
  { batchId: "APL-2045", product: "Apple", quantity: "250 kg", warehouse: "WH-MTH-001", quality: 92, status: "Active", received: "16 Sep 2026" },
  { batchId: "TOM-1160", product: "Tomato", quantity: "180 kg", warehouse: "WH-MTH-001", quality: 78, status: "Review", received: "15 Sep 2026" },
  { batchId: "ORG-8831", product: "Orange", quantity: "320 kg", warehouse: "WH-DEL-002", quality: 96, status: "Active", received: "15 Sep 2026" },
  { batchId: "BAN-3012", product: "Banana", quantity: "90 kg", warehouse: "WH-MTH-001", quality: 54, status: "Quarantined", received: "14 Sep 2026" },
  { batchId: "POT-6620", product: "Potato", quantity: "500 kg", warehouse: "WH-MTH-001", quality: 86, status: "Active", received: "14 Sep 2026" },
];

export const notifications = [
  { title: "New inspection completed", detail: "A saved inspection is ready to review.", time: "2m ago" },
  { title: "Inspection history updated", detail: "Recent model results are available.", time: "24m ago" },
  { title: "Weekly report ready", detail: "Your warehouse summary is available.", time: "1h ago" },
];


