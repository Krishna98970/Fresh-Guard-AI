import type { AIResult, InspectionType } from "./types";

export async function inspectImage(image: File, inspectionType: InspectionType): Promise<AIResult> {
  await new Promise((resolve) => setTimeout(resolve, 2400));
  const name = image.name.toLowerCase();
  const isBatch = inspectionType === "Box / Batch";
  const isRisky = /banana|bruise|damag|reject/.test(name);
  if (isBatch) {
    return { product: "Tomatoes", score: 87, status: "Needs Review", condition: "Mixed quality", confidence: 91.8, grade: "B", decision: "REVIEW", defects: ["Surface bruising detected"], imageUrl: URL.createObjectURL(image), timestamp: "Just now", inspectionType, detectedItems: 20, freshItems: 16, damagedItems: 3, rejectedItems: 1 };
  }
  return { product: isRisky ? "Banana" : "Apple", score: isRisky ? 54 : 92, status: isRisky ? "Rejected" : "Fresh", condition: isRisky ? "Significant visible damage" : "Fresh", confidence: isRisky ? 91.3 : 94.6, grade: isRisky ? "C" : "A", decision: isRisky ? "REJECT" : "ACCEPT", defects: isRisky ? ["Discoloration detected", "Significant visible damage"] : [], imageUrl: URL.createObjectURL(image), timestamp: "Just now", inspectionType };
}
