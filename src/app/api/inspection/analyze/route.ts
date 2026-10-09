import { NextResponse } from 'next/server';
import { analyzeProduceImage } from '@/lib/ai/gemini';
import { store } from '@/lib/db/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderId,
      productId,
      productName,
      batchNumber,
      imageBase64,
      geminiApiKey,
    } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Produce image is required for inspection' },
        { status: 400 }
      );
    }

    const settings = store.getSettings();

    // Call enhanced AI vision engine
    const analysis = await analyzeProduceImage(
      productName || 'Produce Item',
      imageBase64,
      settings.approvalScoreMin,
      settings.reviewScoreMin,
      geminiApiKey
    );

    // Save inspection into universal store
    const newInspection = store.createInspection({
      orderId: orderId || undefined,
      productId: productId || 'prod-custom',
      productName: analysis.product || productName || 'Produce Specimen',
      batchNumber: batchNumber || `BATCH-${Date.now().toString().slice(-4)}`,
      inspectorId: 'usr-inspector-01',
      inspectorName: analysis.modelUsed.includes('Gemini')
        ? 'Gemini 1.5 Vision (Multimodal AI)'
        : 'FreshGuard Optical Vision Engine',
      imageUrl: imageBase64.startsWith('http')
        ? imageBase64
        : imageBase64.length > 500000
        ? 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80'
        : imageBase64,
      overallScore: analysis.quality_score,
      freshnessScore: analysis.freshness_score,
      appearanceScore: analysis.appearance_score,
      ripenessScore: analysis.ripeness_score,
      riskLevel: analysis.risk_level,
      decision: analysis.decision,
      defects: analysis.defects,
      aiExplanation: analysis.ai_explanation,
      recommendation: analysis.recommendation,
      shelfLifeEstimateDays: analysis.shelf_life_days,
      packagingAdvice: analysis.packaging_advice,
      isAiGenerated: true,
    });

    return NextResponse.json({
      success: true,
      inspection: newInspection,
      modelUsed: analysis.modelUsed,
      diagnostics: analysis.diagnostics,
    });
  } catch (err: any) {
    console.error('Inspection analysis error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process inspection' },
      { status: 500 }
    );
  }
}
