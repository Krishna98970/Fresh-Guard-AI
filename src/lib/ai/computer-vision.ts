import { InspectionAnalysis } from './schema';
import { predict, PredictionResult } from '../../../models/predict';

export type OpticalDiagnostics = PredictionResult['diagnostics'];

/**
 * High-Precision Botanical Optical Vision Inference Engine
 * Delegates directly to the calibrated models/predict.ts runtime.
 */
export async function analyzeProduceWithComputerVision(
  imageInput: string | Buffer,
  requestedProductName?: string,
  approvalThreshold = 85,
  reviewThreshold = 70
): Promise<InspectionAnalysis & { diagnostics: OpticalDiagnostics }> {
  let buffer: Buffer;

  if (Buffer.isBuffer(imageInput)) {
    buffer = imageInput;
  } else if (imageInput.startsWith('data:image/')) {
    const base64Data = imageInput.split(',')[1];
    buffer = Buffer.from(base64Data, 'base64');
  } else if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    const res = await fetch(imageInput);
    const arrayBuf = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuf);
  } else {
    buffer = Buffer.from(imageInput, 'base64');
  }

  const prediction = await predict(
    buffer,
    requestedProductName,
    approvalThreshold,
    reviewThreshold
  );

  return prediction;
}
