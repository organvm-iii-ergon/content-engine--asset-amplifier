/**
 * @cronus/domain — Shared domain types for the Cronus Metabolus system.
 *
 * Single source of truth for all TypeScript types across the content engine.
 * Data shapes only — no classes, no runtime logic.
 */

// ---------------------------------------------------------------------------
// Enums (as const objects for tree-shaking and type narrowing)
// ---------------------------------------------------------------------------

export const MediaType = {
  video: "video",
  image: "image",
  image_set: "image_set",
  design: "design",
} as const satisfies Record<string, string>;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const Platform = {
  instagram_feed: "instagram_feed",
  instagram_story: "instagram_story",
  instagram_reels: "instagram_reels",
  linkedin: "linkedin",
  tiktok: "tiktok",
  youtube_shorts: "youtube_shorts",
  x: "x",
} as const satisfies Record<string, string>;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const ProcessingStatus = {
  uploaded: "uploaded",
  processing: "processing",
  extracted: "extracted",
  failed: "failed",
} as const satisfies Record<string, string>;
export type ProcessingStatus =
  (typeof ProcessingStatus)[keyof typeof ProcessingStatus];

export const ApprovalStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  flagged: "flagged",
} as const satisfies Record<string, string>;
export type ApprovalStatus =
  (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const PublishStatus = {
  scheduled: "scheduled",
  publishing: "publishing",
  published: "published",
  failed: "failed",
  cancelled: "cancelled",
} as const satisfies Record<string, string>;
export type PublishStatus = (typeof PublishStatus)[keyof typeof PublishStatus];

export const PlatformConnectionStatus = {
  active: "active",
  expired: "expired",
  revoked: "revoked",
} as const satisfies Record<string, string>;
export type PlatformConnectionStatus =
  (typeof PlatformConnectionStatus)[keyof typeof PlatformConnectionStatus];

export const BrandStatus = {
  active: "active",
  paused: "paused",
  archived: "archived",
} as const satisfies Record<string, string>;
export type BrandStatus = (typeof BrandStatus)[keyof typeof BrandStatus];

export const JobStatus = {
  queued: "queued",
  processing: "processing",
  completed: "completed",
  failed: "failed",
} as const satisfies Record<string, string>;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const JobType = {
  asset_process: "asset_process",
  nc_derive: "nc_derive",
  nc_refine: "nc_refine",
  content_generate: "content_generate",
  content_score: "content_score",
  publish_schedule: "publish_schedule",
  analytics_collect: "analytics_collect",
  design_resize: "design_resize",
} as const satisfies Record<string, string>;
export type JobType = (typeof JobType)[keyof typeof JobType];

export const FragmentType = {
  clip: "clip",
  keyframe: "keyframe",
  crop: "crop",
  text_hook: "text_hook",
  audio_segment: "audio_segment",
} as const satisfies Record<string, string>;
export type FragmentType = (typeof FragmentType)[keyof typeof FragmentType];

export const ScheduleStrategy = {
  optimal: "optimal",
  evenly_distributed: "evenly_distributed",
  manual: "manual",
} as const satisfies Record<string, string>;
export type ScheduleStrategy =
  (typeof ScheduleStrategy)[keyof typeof ScheduleStrategy];

// ---------------------------------------------------------------------------
// Domain interfaces — data shapes only
// ---------------------------------------------------------------------------

export interface Brand {
  id: string;
  agencyId?: string;
  name: string;
  slug: string;
  description?: string;
  brandGuidelinesUrl?: string;
  toneDescription?: string;
  /** Minimum NC alignment score for auto-approval. Default 0.75. */
  consistencyThreshold: number;
  status: BrandStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  contactEmail: string;
  createdAt: Date;
}

export interface NaturalCenter {
  id: string;
  brandId: string;
  version: number;
  thematicCore: Record<string, unknown>;
  aestheticSignature: Record<string, unknown> | string;
  tonalVector: Record<string, unknown> | string;
  narrativeBias: Record<string, unknown> | string;
  symbolicMarkers: Record<string, unknown>[] | string[];
  negativeSpace: Record<string, unknown>[] | string[];
  brandEmbedding: number[];
  confidenceScores: Record<string, number>;
  overallConfidence: number;
  sourceAssetIds: string[];
  systemPrompt: string;
  inquiries: IdentityInquiry[];
  createdAt: Date;
}

export interface IdentityInquiry {
  id: string;
  question: string;
  options?: string[];
  dimension: 'tonal' | 'aesthetic' | 'thematic';
  status: 'pending' | 'answered';
  answer?: string;
  createdAt: Date;
}

export interface Asset {
  id: string;
  brandId: string;
  mediaType: MediaType;
  originalFilename: string;
  storageKey: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  transcription?: string;
  processingStatus: ProcessingStatus;
  fragmentCount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Fragment {
  id: string;
  assetId: string;
  type: FragmentType;
  storageKey: string;
  startTime?: number;
  endTime?: number;
  description?: string;
  qualityScore: number;
  ncAlignmentScore?: number;
  visualEntropy?: number;
  extractionMetadata: Record<string, unknown>;
  createdAt: Date;
}

export interface ContentUnit {
  id: string;
  fragmentId: string;
  brandId: string;
  platform: Platform;
  caption: string;
  mediaKey: string;
  mediaType: "image" | "video" | "carousel";
  hashtags: string[];
  ncScore: number;
  ncScoreBreakdown: Record<string, number>;
  approvalStatus: ApprovalStatus;
  flaggedReason?: string;
  similarityHash: string;
  createdAt: Date;
}

export interface PublishEvent {
  id: string;
  contentUnitId: string;
  platformConnectionId: string;
  scheduledAt: Date;
  publishedAt?: Date;
  status: PublishStatus;
  platformPostId?: string;
  platformPostUrl?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
}

export interface PerformanceObservation {
  id: string;
  publishEventId: string;
  observedAt: Date;
  views: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  followersGained: number;
  engagementRate?: number;
  normalizedScore?: number;
  rawMetrics: Record<string, unknown>;
}

export interface PlatformConnection {
  id: string;
  brandId: string;
  platform: Platform;
  platformAccountId: string;
  platformAccountName?: string;
  status: PlatformConnectionStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes: string[];
  rateLimitState: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  /** Completion fraction in [0, 1]. */
  progress: number;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Utility types — creation payloads
// ---------------------------------------------------------------------------

export type CreateBrand = Omit<Brand, "id" | "slug" | "createdAt" | "updatedAt">;

export type CreateAsset = Pick<
  Asset,
  "brandId" | "mediaType" | "originalFilename" | "storageKey" | "fileSizeBytes"
> &
  Partial<Pick<Asset, "durationSeconds" | "width" | "height">>;
