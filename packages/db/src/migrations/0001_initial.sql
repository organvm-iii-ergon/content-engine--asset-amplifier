-- Cronus Metabolus: Initial Schema Migration
-- Generated: 2026-03-26

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- agencies
-- ============================================================================
CREATE TABLE agencies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  primary_color TEXT,
  contact_email TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- brands
-- ============================================================================
CREATE TABLE brands (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id               UUID REFERENCES agencies(id) ON DELETE RESTRICT,
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL UNIQUE,
  description             TEXT,
  brand_guidelines_url    TEXT,
  tone_description        TEXT,
  consistency_threshold   REAL NOT NULL DEFAULT 0.75,
  status                  TEXT NOT NULL DEFAULT 'active',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- natural_centers
-- ============================================================================
CREATE TABLE natural_centers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id            UUID NOT NULL UNIQUE REFERENCES brands(id) ON DELETE RESTRICT,
  version             INTEGER NOT NULL DEFAULT 1,
  thematic_core       JSONB NOT NULL,
  aesthetic_signature JSONB NOT NULL,
  tonal_vector        JSONB NOT NULL,
  narrative_bias      JSONB NOT NULL,
  symbolic_markers    JSONB NOT NULL,
  negative_space      JSONB NOT NULL,
  brand_embedding     TEXT NOT NULL,
  confidence_scores   JSONB NOT NULL,
  overall_confidence  REAL NOT NULL,
  source_asset_ids    JSONB NOT NULL,
  system_prompt       TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- assets
-- ============================================================================
CREATE TABLE assets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id            UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  media_type          TEXT NOT NULL,
  original_filename   TEXT NOT NULL,
  storage_key         TEXT NOT NULL,
  file_size_bytes     BIGINT NOT NULL,
  duration_seconds    REAL,
  width               INTEGER,
  height              INTEGER,
  transcription       TEXT,
  processing_status   TEXT NOT NULL DEFAULT 'uploaded',
  fragment_count      INTEGER DEFAULT 0,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- fragments
-- ============================================================================
CREATE TABLE fragments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id              UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  type                  TEXT NOT NULL,
  storage_key           TEXT NOT NULL,
  start_time            REAL,
  end_time              REAL,
  description           TEXT,
  quality_score         REAL NOT NULL,
  nc_alignment_score    REAL,
  visual_entropy        REAL,
  extraction_metadata   JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fragments_asset_id ON fragments(asset_id);

-- ============================================================================
-- content_units
-- ============================================================================
CREATE TABLE content_units (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fragment_id         UUID NOT NULL REFERENCES fragments(id) ON DELETE RESTRICT,
  brand_id            UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  platform            TEXT NOT NULL,
  caption             TEXT NOT NULL,
  media_key           TEXT NOT NULL,
  media_type          TEXT NOT NULL,
  hashtags            JSONB DEFAULT '[]',
  nc_score            REAL NOT NULL,
  nc_score_breakdown  JSONB NOT NULL,
  approval_status     TEXT NOT NULL DEFAULT 'pending',
  flagged_reason      TEXT,
  similarity_hash     TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_units_fragment_id ON content_units(fragment_id);
CREATE INDEX idx_content_units_brand_id ON content_units(brand_id);

-- ============================================================================
-- platform_connections
-- ============================================================================
CREATE TABLE platform_connections (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id                UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  platform                TEXT NOT NULL,
  platform_account_id     TEXT NOT NULL,
  platform_account_name   TEXT,
  access_token            TEXT NOT NULL,
  refresh_token           TEXT,
  token_expires_at        TIMESTAMPTZ,
  scopes                  JSONB NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'active',
  rate_limit_state        JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_platform_connections_brand_platform_account
  ON platform_connections(brand_id, platform, platform_account_id);

-- ============================================================================
-- publish_events
-- ============================================================================
CREATE TABLE publish_events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_unit_id         UUID NOT NULL REFERENCES content_units(id) ON DELETE RESTRICT,
  platform_connection_id  UUID NOT NULL REFERENCES platform_connections(id) ON DELETE RESTRICT,
  scheduled_at            TIMESTAMPTZ NOT NULL,
  published_at            TIMESTAMPTZ,
  status                  TEXT NOT NULL DEFAULT 'scheduled',
  platform_post_id        TEXT,
  platform_post_url       TEXT,
  error_message           TEXT,
  retry_count             INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_publish_events_content_unit_id ON publish_events(content_unit_id);
CREATE INDEX idx_publish_events_status ON publish_events(status);

-- ============================================================================
-- performance_observations
-- ============================================================================
CREATE TABLE performance_observations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_event_id    UUID NOT NULL REFERENCES publish_events(id) ON DELETE RESTRICT,
  observed_at         TIMESTAMPTZ NOT NULL,
  views               INTEGER DEFAULT 0,
  impressions         INTEGER DEFAULT 0,
  reach               INTEGER DEFAULT 0,
  likes               INTEGER DEFAULT 0,
  comments            INTEGER DEFAULT 0,
  shares              INTEGER DEFAULT 0,
  saves               INTEGER DEFAULT 0,
  clicks              INTEGER DEFAULT 0,
  followers_gained    INTEGER DEFAULT 0,
  engagement_rate     REAL,
  normalized_score    REAL,
  raw_metrics         JSONB DEFAULT '{}'
);

CREATE INDEX idx_performance_observations_event_observed
  ON performance_observations(publish_event_id, observed_at);

-- ============================================================================
-- asset_attribution VIEW
-- Traces content performance back to the source asset for ROI analysis.
-- ============================================================================
CREATE VIEW asset_attribution AS
SELECT
  a.id                    AS asset_id,
  a.brand_id,
  a.media_type            AS asset_media_type,
  a.original_filename,
  f.id                    AS fragment_id,
  f.type                  AS fragment_type,
  f.quality_score,
  cu.id                   AS content_unit_id,
  cu.platform,
  cu.nc_score,
  cu.approval_status,
  pe.id                   AS publish_event_id,
  pe.status               AS publish_status,
  pe.published_at,
  po.views,
  po.impressions,
  po.likes,
  po.comments,
  po.shares,
  po.saves,
  po.clicks,
  po.engagement_rate,
  po.normalized_score
FROM assets a
  JOIN fragments f         ON f.asset_id = a.id
  JOIN content_units cu    ON cu.fragment_id = f.id
  LEFT JOIN publish_events pe ON pe.content_unit_id = cu.id
  LEFT JOIN performance_observations po ON po.publish_event_id = pe.id;
