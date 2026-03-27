/**
 * Estimates confidence levels for brand identity dimensions.
 */
export function estimateNCConfidence(params: {
  assetCount: number;
  hasGuidelines: boolean;
  signalConsistency: number; // 0-1
}) {
  const { assetCount, hasGuidelines, signalConsistency } = params;

  // Heuristic-based scoring
  const visualConfidence = Math.min(0.3 + (assetCount * 0.1), 0.9);
  const tonalConfidence = hasGuidelines ? 0.85 : Math.min(0.4 + (assetCount * 0.05), 0.8);
  
  const overall = (visualConfidence + tonalConfidence + signalConsistency) / 3;

  return {
    scores: {
      visual: visualConfidence,
      tonal: tonalConfidence,
      consistency: signalConsistency
    },
    overall,
    usable: overall > 0.5
  };
}
