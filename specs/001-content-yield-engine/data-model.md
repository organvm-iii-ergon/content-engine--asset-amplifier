# Data Model: Content Yield Engine

## Entity Relationship Overview

```
Agency 1──* Brand/Client
Brand  1──* Asset
Brand  1──1 NaturalCenter
Asset  1──* Fragment
Fragment 1──* ContentUnit
ContentUnit 1──* PublishEvent
PublishEvent 1──* PerformanceObservation
Brand  1──* PlatformConnection
```

## Entities

### Brand

The tenant entity. Every asset, identity profile, and content calendar belongs to a brand.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| agency_id | UUID | FK → Agency, nullable | null = direct brand, not agency-managed |
| name | text | NOT NULL | |
| slug | text | UNIQUE, NOT NULL | URL-safe identifier |
| description | text | nullable | |
| brand_guidelines_url | text | nullable | Link to uploaded brand guide |
| tone_description | text | nullable | Free-text voice/tone input from user |
| consistency_threshold | float | NOT NULL, DEFAULT 0.75 | Minimum NC score for auto-approval |
| status | enum | NOT NULL, DEFAULT 'active' | active, paused, archived |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

### Agency

Multi-client operator. Owns brands, sees aggregate metrics, applies white-label branding.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| name | text | NOT NULL | |
| slug | text | UNIQUE, NOT NULL | |
| logo_url | text | nullable | White-label logo |
| primary_color | text | nullable | Hex color for reports |
| contact_email | text | NOT NULL | |
| created_at | timestamptz | NOT NULL | |

### NaturalCenter

Computable brand identity. One per brand, versioned. The mathematical object from the genesis corpus: NC(B) = \<T, A, τ, N, S, Ω, I, M, E\>.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| brand_id | UUID | FK → Brand, UNIQUE | One active NC per brand |
| version | int | NOT NULL, DEFAULT 1 | Increments on refinement |
| thematic_core | jsonb | NOT NULL | Clustered theme descriptors |
| aesthetic_signature | jsonb | NOT NULL | Visual style parameters |
| tonal_vector | jsonb | NOT NULL | Voice/tone encoding |
| narrative_bias | jsonb | NOT NULL | Storytelling patterns |
| symbolic_markers | jsonb | NOT NULL | Recurring symbols/motifs |
| negative_space | jsonb | NOT NULL | What the brand is NOT |
| brand_embedding | vector(1536) | NOT NULL | pgvector — unified embedding for scoring |
| confidence_scores | jsonb | NOT NULL | Per-dimension confidence (0-1) |
| overall_confidence | float | NOT NULL | Weighted aggregate confidence |
| source_asset_ids | UUID[] | NOT NULL | Assets used to derive this NC |
| system_prompt | text | NOT NULL | Compiled prompt for Claude generation |
| created_at | timestamptz | NOT NULL | |

**State transitions**: derived → refined (user adjustments) → evolved (learning from performance data)

### Asset

Source material uploaded by a brand owner. The input to the transformation pipeline.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| brand_id | UUID | FK → Brand, NOT NULL | |
| media_type | enum | NOT NULL | video, image, image_set, design |
| original_filename | text | NOT NULL | |
| storage_key | text | NOT NULL | Object storage path |
| file_size_bytes | bigint | NOT NULL | |
| duration_seconds | float | nullable | Video only |
| width | int | nullable | |
| height | int | nullable | |
| transcription | text | nullable | Whisper output for video/audio |
| processing_status | enum | NOT NULL, DEFAULT 'uploaded' | uploaded, processing, extracted, failed |
| fragment_count | int | DEFAULT 0 | Denormalized for fast display |
| metadata | jsonb | DEFAULT '{}' | Format-specific metadata |
| created_at | timestamptz | NOT NULL | |

### Fragment

Derived unit from an asset. The intermediate representation between source and output.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| asset_id | UUID | FK → Asset, NOT NULL | Lineage: fragment → asset |
| type | enum | NOT NULL | clip, keyframe, crop, text_hook, audio_segment |
| storage_key | text | NOT NULL | Object storage path |
| start_time | float | nullable | Video: seconds offset |
| end_time | float | nullable | Video: seconds offset |
| description | text | nullable | AI-generated description of fragment content |
| quality_score | float | NOT NULL | 0-1, composite extraction quality |
| nc_alignment_score | float | nullable | How well fragment aligns with brand NC |
| visual_entropy | float | nullable | Information density metric |
| extraction_metadata | jsonb | DEFAULT '{}' | Algorithm parameters, scene detection data |
| created_at | timestamptz | NOT NULL | |

### ContentUnit

Generated post ready for platform-specific formatting. The output of the generation pipeline.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| fragment_id | UUID | FK → Fragment, NOT NULL | Lineage: unit → fragment |
| brand_id | UUID | FK → Brand, NOT NULL | Denormalized for query efficiency |
| platform | enum | NOT NULL | instagram_feed, instagram_story, instagram_reels, linkedin, tiktok, youtube_shorts, x |
| caption | text | NOT NULL | Generated caption text |
| media_key | text | NOT NULL | Platform-formatted media in storage |
| media_type | enum | NOT NULL | image, video, carousel |
| hashtags | text[] | DEFAULT '{}' | |
| nc_score | float | NOT NULL | Brand consistency score (0-1) |
| nc_score_breakdown | jsonb | NOT NULL | Per-dimension scores |
| approval_status | enum | NOT NULL, DEFAULT 'pending' | pending, approved, rejected, flagged |
| flagged_reason | text | nullable | If flagged: why (low NC score, duplicate, etc.) |
| similarity_hash | text | NOT NULL | For deduplication |
| created_at | timestamptz | NOT NULL | |

### PublishEvent

A scheduled or completed publication to a platform. Bridges content to performance.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| content_unit_id | UUID | FK → ContentUnit, NOT NULL | Lineage: event → unit |
| platform_connection_id | UUID | FK → PlatformConnection, NOT NULL | Which connected account |
| scheduled_at | timestamptz | NOT NULL | When to publish |
| published_at | timestamptz | nullable | Actual publish time |
| status | enum | NOT NULL, DEFAULT 'scheduled' | scheduled, publishing, published, failed, cancelled |
| platform_post_id | text | nullable | ID returned by platform API |
| platform_post_url | text | nullable | Direct link to published post |
| error_message | text | nullable | If failed |
| retry_count | int | DEFAULT 0 | |
| created_at | timestamptz | NOT NULL | |

### PerformanceObservation

Time-series engagement data for published content. Collected periodically from platform APIs.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| publish_event_id | UUID | FK → PublishEvent, NOT NULL | Lineage: observation → event |
| observed_at | timestamptz | NOT NULL | When metrics were collected |
| views | int | DEFAULT 0 | |
| impressions | int | DEFAULT 0 | |
| reach | int | DEFAULT 0 | |
| likes | int | DEFAULT 0 | |
| comments | int | DEFAULT 0 | |
| shares | int | DEFAULT 0 | |
| saves | int | DEFAULT 0 | |
| clicks | int | DEFAULT 0 | |
| followers_gained | int | DEFAULT 0 | |
| engagement_rate | float | nullable | Platform-reported or computed |
| normalized_score | float | nullable | Cross-platform normalized (0-1) |
| raw_metrics | jsonb | DEFAULT '{}' | Platform-specific fields |

**Index strategy**: Composite index on (publish_event_id, observed_at) for time-series queries. Partition by month if volume warrants.

### PlatformConnection

OAuth connection to a social platform for a brand.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| brand_id | UUID | FK → Brand, NOT NULL | |
| platform | enum | NOT NULL | instagram, linkedin, tiktok, youtube, x |
| platform_account_id | text | NOT NULL | Platform's user/page ID |
| platform_account_name | text | nullable | Display name |
| access_token | text | NOT NULL | Encrypted at rest |
| refresh_token | text | nullable | Encrypted at rest |
| token_expires_at | timestamptz | nullable | |
| scopes | text[] | NOT NULL | Granted OAuth scopes |
| status | enum | NOT NULL, DEFAULT 'active' | active, expired, revoked |
| rate_limit_state | jsonb | DEFAULT '{}' | Current rate limit counters |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

**Constraint**: UNIQUE (brand_id, platform, platform_account_id)

## Lineage Integrity Enforcement

The four-level lineage (Asset → Fragment → ContentUnit → PublishEvent → PerformanceObservation) is enforced at the database level via foreign keys with `ON DELETE RESTRICT`. No orphaned records. Deleting an asset requires cascading through the full chain with explicit confirmation.

Query to trace full lineage for a performance observation:
```sql
SELECT
  po.*, pe.platform_post_url, cu.caption, cu.nc_score,
  f.type AS fragment_type, f.quality_score,
  a.original_filename, a.media_type
FROM performance_observations po
JOIN publish_events pe ON po.publish_event_id = pe.id
JOIN content_units cu ON pe.content_unit_id = cu.id
JOIN fragments f ON cu.fragment_id = f.id
JOIN assets a ON f.asset_id = a.id
WHERE po.id = $1;
```

## Attribution Roll-up Views

```sql
-- Asset-level attribution: total performance from all content derived from one asset
CREATE VIEW asset_attribution AS
SELECT
  a.id AS asset_id,
  a.brand_id,
  COUNT(DISTINCT cu.id) AS content_units_generated,
  COUNT(DISTINCT pe.id) AS posts_published,
  SUM(po.views) AS total_views,
  SUM(po.likes + po.comments + po.shares + po.saves) AS total_engagement,
  CASE WHEN SUM(po.views) > 0
    THEN SUM(po.likes + po.comments + po.shares + po.saves)::float / SUM(po.views)
    ELSE 0 END AS engagement_rate,
  COUNT(DISTINCT f.id) AS fragments_used
FROM assets a
LEFT JOIN fragments f ON f.asset_id = a.id
LEFT JOIN content_units cu ON cu.fragment_id = f.id
LEFT JOIN publish_events pe ON pe.content_unit_id = cu.id AND pe.status = 'published'
LEFT JOIN performance_observations po ON po.publish_event_id = pe.id
GROUP BY a.id, a.brand_id;
```
