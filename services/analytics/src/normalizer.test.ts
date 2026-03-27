import { describe, it, expect } from 'vitest';
import { normalizeMetrics } from './normalizer.js';

describe('normalizeMetrics', () => {
  it('returns 0 for zero views', () => {
    expect(normalizeMetrics({ platform: 'instagram_feed', views: 0, engagement: 10 })).toBe(0);
  });

  it('returns value between 0 and 1', () => {
    const score = normalizeMetrics({ platform: 'instagram_feed', views: 1000, engagement: 50 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('higher engagement rate yields higher score', () => {
    const low = normalizeMetrics({ platform: 'linkedin', views: 1000, engagement: 10 });
    const high = normalizeMetrics({ platform: 'linkedin', views: 1000, engagement: 100 });
    expect(high).toBeGreaterThan(low);
  });

  it('applies platform-specific multipliers', () => {
    // TikTok has lower multiplier (0.3) than Instagram feed (1.0)
    const ig = normalizeMetrics({ platform: 'instagram_feed', views: 1000, engagement: 50 });
    const tt = normalizeMetrics({ platform: 'tiktok', views: 1000, engagement: 50 });
    expect(ig).toBeGreaterThan(tt);
  });

  it('clamps score to maximum of 1', () => {
    // Very high engagement relative to views should still cap at 1
    const score = normalizeMetrics({ platform: 'instagram_story', views: 10, engagement: 100 });
    expect(score).toBeLessThanOrEqual(1);
  });

  it('handles all supported platforms without error', () => {
    const platforms = ['instagram_feed', 'instagram_story', 'instagram_reels', 'linkedin', 'tiktok', 'youtube_shorts', 'x'] as const;
    for (const platform of platforms) {
      const score = normalizeMetrics({ platform, views: 500, engagement: 25 });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});
