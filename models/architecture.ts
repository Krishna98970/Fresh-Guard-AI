/**
 * FreshGuard AI — Botanical Vision Model Architecture
 * 
 * Defines feature extraction layers, optical sensors, botanical defect detectors,
 * and circular spectral vector math for fresh produce inspection.
 */

export interface ModelWeights {
  brownRot: {
    minHue: number;
    maxHue: number;
    maxLuminance: number;
    maxSaturation: number;
    minRedToGreenRatio: number;
    minRedToBlueRatio: number;
    rejectionSurfaceThreshold: number;
    confidence: number;
  };
  cellularNecrosis: {
    deepLuminanceCutoff: number;
    compressionMaxLuminance: number;
    compressionMaxSaturation: number;
    maxRedGreenDelta: number;
    maxBlueCutoff: number;
    confidence: number;
  };
  fungalMold: {
    maxSaturation: number;
    minLuminance: number;
    maxLuminance: number;
    contrastDeltaThreshold: number;
    confidence: number;
  };
  backgroundSegmentation: {
    borderMarginRatio: number;
    colorDistanceTolerance: number;
    whiteBackdropThreshold: number;
    whiteBackdropMaxSaturation: number;
    darkBackdropThreshold: number;
  };
  scoring: {
    gradeAMaxDefectRatio: number;
    reviewMinDefectRatio: number;
    reviewMaxDefectRatio: number;
    rejectedMinDefectRatio: number;
    baseApprovalThreshold: number;
    baseReviewThreshold: number;
    severeScoreFloor: number;
    severeScoreCeiling: number;
    moderateScoreFloor: number;
    moderateScoreCeiling: number;
    pristineScoreFloor: number;
    pristineScoreCeiling: number;
  };
}

export interface ProduceVisionModel {
  modelName: string;
  version: string;
  architecture: string;
  trainedAt: string;
  dataset: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    validationLoss: number;
    trainedEpochs: number;
    sampleCount: number;
  };
  hyperparameters: {
    resolution: number;
    channels: number;
    borderSamplingMargin: number;
    circularTrigMean: boolean;
    dynamicContrastPass: boolean;
  };
  weights: ModelWeights;
  taxonomyRules: Record<string, any>;
}

export interface ExtractedProduceFeatures {
  pixelCount: number;
  producePixelCount: number;
  aspectRatio: number;
  avgHue: number;
  avgSaturation: number;
  avgLuminance: number;
  dominantColor: string;
  hueBins: {
    red: number;
    brownRot: number;
    yellow: number;
    green: number;
    blueViolet: number;
  };
  defects: {
    brownRotPixels: number;
    necroticBruisePixels: number;
    moldPixels: number;
    dynamicBlemishes: number;
    totalDefectPixels: number;
    defectRatio: number;
    brownRotRatio: number;
    blemishTopQuarter: number;
    blemishBottomQuarter: number;
    blemishCenter: number;
  };
}

// Convert RGB (0-255) to HSL (H: 0-360, S: 0-1, L: 0-1)
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s, l];
}

// Adaptive background profiler: Samples image perimeter border to learn background chromatic profile
export function learnBackgroundProfile(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  marginRatio = 0.05
) {
  let borderR = 0, borderG = 0, borderB = 0, borderCount = 0;
  const marginX = Math.max(2, Math.floor(width * marginRatio));
  const marginY = Math.max(2, Math.floor(height * marginRatio));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBorder = x < marginX || x > width - marginX || y < marginY || y > height - marginY;
      if (isBorder) {
        const idx = (y * width + x) * channels;
        borderR += data[idx];
        borderG += data[idx + 1];
        borderB += data[idx + 2];
        borderCount++;
      }
    }
  }

  const bgR = borderCount > 0 ? borderR / borderCount : 255;
  const bgG = borderCount > 0 ? borderG / borderCount : 255;
  const bgB = borderCount > 0 ? borderB / borderCount : 255;
  const [, , bgL] = rgbToHsl(bgR, bgG, bgB);

  return {
    bgR,
    bgG,
    bgB,
    bgL,
    isWhite: bgL > 0.80,
    isDark: bgL < 0.22,
  };
}
