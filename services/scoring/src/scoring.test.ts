import { describe, it, expect } from 'vitest';

/**
 * calculateCosineSimilarity is a module-private function in the scoring service.
 * We replicate its exact logic here to test the algorithm in isolation,
 * without pulling in DB/provider dependencies from the service entrypoint.
 */
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

describe('calculateCosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(calculateCosineSimilarity([1, 0, 0], [1, 0, 0])).toBe(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(calculateCosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it('returns -1 for opposite vectors', () => {
    expect(calculateCosineSimilarity([1, 0], [-1, 0])).toBe(-1);
  });

  it('returns 0 for zero vectors', () => {
    expect(calculateCosineSimilarity([0, 0], [0, 0])).toBe(0);
  });

  it('returns 0 for mismatched lengths', () => {
    expect(calculateCosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it('handles real embedding-like vectors', () => {
    const a = [0.1, 0.2, 0.3, 0.4];
    const b = [0.1, 0.2, 0.3, 0.4];
    expect(calculateCosineSimilarity(a, b)).toBeCloseTo(1.0, 5);
  });

  it('handles partially similar vectors', () => {
    const a = [1, 1, 0, 0];
    const b = [1, 0, 1, 0];
    const sim = calculateCosineSimilarity(a, b);
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
    expect(sim).toBeCloseTo(0.5, 5);
  });
});
