import { InspectionAnalysis, InspectionAnalysisSchema } from './schema';
import { analyzeProduceWithComputerVision, OpticalDiagnostics } from './computer-vision';
import { store } from '@/lib/db/store';

export async function analyzeProduceImage(
  productName: string,
  base64Image: string,
  approvalThreshold = 85,
  reviewThreshold = 70,
  overrideApiKey?: string
): Promise<InspectionAnalysis & { diagnostics?: OpticalDiagnostics; modelUsed: string }> {
  // Check apiKey from override, store settings, or process.env
  const settings = store.getSettings();
  const apiKey = overrideApiKey || settings.geminiApiKey || process.env.GEMINI_API_KEY;

  // Strip data URL prefix if present for binary/base64 processing
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  // 1. If Gemini API Key is configured, attempt multimodal call
  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && apiKey.trim().length > 10) {
    try {
      const prompt = `You are FreshGuard AI, an elite industrial computer vision and produce quality inspection system for quick-commerce logistics.
Carefully analyze the attached produce image.

CRITICAL INSPECTION RULES:
1. PRODUCE IDENTIFICATION: Identify what produce is ACTUALLY in the image. (Hint: "${productName}", but prioritize what you observe visually).
2. PHYSICAL DEFECT ANALYSIS:
   - Check for surface mold, fungal mycelium, or white/gray fuzzy growth.
   - Check for soft spots, compression bruising, or cell collapse.
   - Check for mechanical cuts, punctures, or skin abrasions.
   - Check for discoloration, dark necrotic spots, or dehydration wrinkling.
   - Check ripeness state (underripe, optimal, overripe/senescent).
3. SCORING CRITERIA:
   - SEVERE DEFECTS (Mold, deep bruising, rotting, inedible): Score 30-65 -> decision: "REJECTED", risk_level: "HIGH"
   - MODERATE DEFECTS (Light bruises, slight overripeness, surface blemish): Score 70-84 -> decision: "REVIEW", risk_level: "MEDIUM"
   - PRISTINE PRODUCE (Fresh, vibrant, unblemished, Grade A): Score 85-98 -> decision: "APPROVED", risk_level: "LOW"

Return ONLY raw, valid JSON (no markdown fences, no explanatory text):
{
  "product": "Exact produce identified in image",
  "quality_score": number (0 to 100 integer),
  "freshness_score": number (0 to 100 integer),
  "appearance_score": number (0 to 100 integer),
  "ripeness_score": number (0 to 100 integer),
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "decision": "APPROVED" | "REVIEW" | "REJECTED",
  "defects": [
    {
      "id": "def-1",
      "type": "BRUISE" | "CUT" | "MOLD" | "DISCOLORATION" | "OVERRIPE" | "DEHYDRATION" | "PEST_DAMAGE",
      "severity": "MINOR" | "MODERATE" | "SEVERE",
      "locationDescription": "Precise location description",
      "confidence": number between 0.8 and 0.99
    }
  ],
  "ai_explanation": "Detailed visual explanation of physical inspection findings",
  "recommendation": "Actionable logistics recommendation for fulfillment or rejection",
  "shelf_life_days": number (1 to 14),
  "packaging_advice": "Recommended packaging protection based on produce fragility"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const parsed = JSON.parse(candidateText.trim());

          // Apply deterministic business thresholds
          if (parsed.quality_score >= approvalThreshold) {
            parsed.decision = 'APPROVED';
            parsed.risk_level = 'LOW';
          } else if (parsed.quality_score >= reviewThreshold) {
            parsed.decision = 'REVIEW';
            parsed.risk_level = 'MEDIUM';
          } else {
            parsed.decision = 'REJECTED';
            parsed.risk_level = 'HIGH';
          }

          const validated = InspectionAnalysisSchema.parse(parsed);

          // Extract pixel-level optical diagnostics with sharp to accompany Gemini output
          let diagnostics: OpticalDiagnostics | undefined = undefined;
          try {
            const cv = await analyzeProduceWithComputerVision(
              base64Image,
              validated.product || productName,
              approvalThreshold,
              reviewThreshold
            );
            diagnostics = cv.diagnostics;
          } catch (e) {
            console.warn('Could not extract optical diagnostics for Gemini result:', e);
          }

          return {
            ...validated,
            diagnostics,
            modelUsed: 'Google Gemini 1.5 Flash Vision (Multimodal)',
          };
        }
      } else {
        const errText = await response.text();
        console.warn('Gemini API error, falling back to real pixel computer vision:', errText);
      }
    } catch (err) {
      console.warn('Gemini Vision network/parse error, falling back to real pixel computer vision:', err);
    }
  }

  // 2. High-Precision Computer Vision Engine (Sharp Pixel & Texture Analysis)
  // Evaluates real RGB/HSL pixels, blemish surface clusters, and color entropy directly
  const cvAnalysis = await analyzeProduceWithComputerVision(
    base64Image,
    productName,
    approvalThreshold,
    reviewThreshold
  );

  return {
    ...cvAnalysis,
    modelUsed: 'FreshGuard Industrial Computer Vision (Pixel & Texture Matrix)',
  };
}
