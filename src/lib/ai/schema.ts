import { z } from 'zod';

export const DefectSchema = z.object({
  id: z.string().default(() => `def-${Math.random().toString(36).substring(2, 7)}`),
  type: z.enum(['BRUISE', 'CUT', 'MOLD', 'DISCOLORATION', 'OVERRIPE', 'DEHYDRATION', 'PEST_DAMAGE']),
  severity: z.enum(['MINOR', 'MODERATE', 'SEVERE']),
  locationDescription: z.string(),
  confidence: z.number().min(0).max(1).default(0.95),
});

export const InspectionAnalysisSchema = z.object({
  product: z.string(),
  quality_score: z.number().min(0).max(100),
  freshness_score: z.number().min(0).max(100),
  appearance_score: z.number().min(0).max(100),
  ripeness_score: z.number().min(0).max(100),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  decision: z.enum(['APPROVED', 'REVIEW', 'REJECTED']),
  defects: z.array(DefectSchema).default([]),
  ai_explanation: z.string(),
  recommendation: z.string(),
  shelf_life_days: z.number().int().min(1).max(30).default(5),
  packaging_advice: z.string().default('Standard ventilated produce packaging'),
});

export type InspectionAnalysis = z.infer<typeof InspectionAnalysisSchema>;
