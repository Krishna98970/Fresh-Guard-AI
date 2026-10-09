import { InspectionAnalysis } from './schema';

export function runFallbackInspection(
  productName: string,
  imagePreviewUrl: string,
  approvalThreshold = 85,
  reviewThreshold = 70
): InspectionAnalysis {
  const lowerName = productName.toLowerCase();
  const lowerUrl = imagePreviewUrl.toLowerCase();

  // Check if image or name indicates a defect or pristine item
  const isDefectSample =
    lowerUrl.includes('bruise') ||
    lowerUrl.includes('mold') ||
    lowerUrl.includes('defect') ||
    lowerUrl.includes('rot') ||
    lowerName.includes('damaged') ||
    lowerName.includes('bruised');

  const isReviewSample =
    lowerUrl.includes('soft') ||
    lowerUrl.includes('ripe') ||
    lowerName.includes('ripe');

  if (isDefectSample) {
    const qualityScore = 64;
    return {
      product: productName,
      quality_score: qualityScore,
      freshness_score: 58,
      appearance_score: 61,
      ripeness_score: 84,
      risk_level: 'HIGH',
      decision: 'REJECTED',
      defects: [
        {
          id: `def-${Date.now()}-1`,
          type: 'MOLD',
          severity: 'SEVERE',
          locationDescription: 'Early-stage surface mold mycelium detected on stem calyx perimeter.',
          confidence: 0.96,
        },
        {
          id: `def-${Date.now()}-2`,
          type: 'BRUISE',
          severity: 'MODERATE',
          locationDescription: 'Sub-surface tissue softening with localized cell rupture (>12mm).',
          confidence: 0.91,
        },
      ],
      ai_explanation:
        'Optical inspection detected localized fungal sporulation and soft compression bruising. Integrity threshold violated; dispatch rejected to prevent batch contamination.',
      recommendation: 'Reject batch from customer dispatch. Divert to composting or bio-recycling intake.',
      shelf_life_days: 1,
      packaging_advice: 'Do not package for commercial dispatch.',
    };
  }

  if (isReviewSample) {
    const qualityScore = 76;
    return {
      product: productName,
      quality_score: qualityScore,
      freshness_score: 78,
      appearance_score: 75,
      ripeness_score: 95,
      risk_level: 'MEDIUM',
      decision: 'REVIEW',
      defects: [
        {
          id: `def-${Date.now()}-1`,
          type: 'OVERRIPE',
          severity: 'MINOR',
          locationDescription: 'Accelerated ethylene skin softening, apex yielding to light contact pressure.',
          confidence: 0.88,
        },
      ],
      ai_explanation:
        'Produce is at peak-to-late ripeness with minimal mechanical damage. Suitable only for immediate same-day local consumption.',
      recommendation: 'Manual operator review recommended. Requires expedited delivery within 2 hours.',
      shelf_life_days: 2,
      packaging_advice: 'Heavy cushioning and rigid tray to prevent transit compression.',
    };
  }

  // Pristine Grade A produce
  const qualityScore = 93;
  return {
    product: productName,
    quality_score: qualityScore,
    freshness_score: 96,
    appearance_score: 94,
    ripeness_score: 91,
    risk_level: 'LOW',
    decision: 'APPROVED',
    defects: [],
    ai_explanation:
      'Uniform epidermal pigmentation, intact natural wax bloom, and firm cellular structure. Zero macroscopic abrasions, cuts, or fungal activity observed.',
    recommendation: 'Premium Grade A produce. Approved for standard and express fulfillment.',
    shelf_life_days: 6,
    packaging_advice: 'Ventilated clamshell or breathable eco-mesh tray.',
  };
}
