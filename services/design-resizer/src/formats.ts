export interface DesignFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
  platform: string;
  description: string;
}

export const DESIGN_FORMATS: DesignFormat[] = [
  {
    id: 'instagram_feed_1080x1080',
    name: 'Instagram Feed (Square)',
    width: 1080,
    height: 1080,
    aspectRatio: 1,
    platform: 'instagram',
    description: 'Standard square post for Instagram feed.',
  },
  {
    id: 'instagram_story_1080x1920',
    name: 'Instagram Story (Vertical)',
    width: 1080,
    height: 1920,
    aspectRatio: 9 / 16,
    platform: 'instagram',
    description: 'Vertical post for Stories and Reels.',
  },
  {
    id: 'facebook_feed_1200x628',
    name: 'Facebook Feed (Landscape)',
    width: 1200,
    height: 628,
    aspectRatio: 1.91,
    platform: 'facebook',
    description: 'Landscape post for Facebook feed.',
  },
  {
    id: 'linkedin_1200x627',
    name: 'LinkedIn (Landscape)',
    width: 1200,
    height: 627,
    aspectRatio: 1.91,
    platform: 'linkedin',
    description: 'Standard landscape post for LinkedIn.',
  },
  {
    id: 'x_1600x900',
    name: 'X (Twitter) Landscape',
    width: 1600,
    height: 900,
    aspectRatio: 16 / 9,
    platform: 'x',
    description: 'Standard landscape post for X.',
  },
  {
    id: 'youtube_thumb_1280x720',
    name: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    aspectRatio: 16 / 9,
    platform: 'youtube',
    description: 'Thumbnail for YouTube videos.',
  },
  {
    id: 'display_300x250',
    name: 'Google Display (Medium Rectangle)',
    width: 300,
    height: 250,
    aspectRatio: 1.2,
    platform: 'google_display',
    description: 'Common display ad size.',
  },
  {
    id: 'display_728x90',
    name: 'Google Display (Leaderboard)',
    width: 728,
    height: 90,
    aspectRatio: 8.08,
    platform: 'google_display',
    description: 'Leaderboard banner ad.',
  },
  {
    id: 'display_160x600',
    name: 'Google Display (Wide Skyscraper)',
    width: 160,
    height: 600,
    aspectRatio: 0.26,
    platform: 'google_display',
    description: 'Tall sidebar ad.',
  },
];

export function getFormat(id: string): DesignFormat | undefined {
  return DESIGN_FORMATS.find(f => f.id === id);
}
