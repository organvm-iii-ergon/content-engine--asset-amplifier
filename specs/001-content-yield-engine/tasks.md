# Tasks: Content Yield Engine (Cronus Metabolus)

**Input**: Design documents from `/specs/001-content-yield-engine/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.yaml, quickstart.md

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US6, INFRA for shared)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo initialization, toolchain, dependencies

- [x] T001 [INFRA] Initialize pnpm monorepo with Turborepo — create root `package.json`, `pnpm-workspace.yaml`, `turbo.json` with build/test/lint pipelines
- [x] T002 [INFRA] Create full directory structure from plan.md — all `apps/`, `services/`, `packages/`, `infra/`, `tests/` directories with placeholder `package.json` files per workspace
- [x] T003 [P] [INFRA] Configure TypeScript — root `tsconfig.json` with strict mode, per-workspace `tsconfig.json` extending root, path aliases for `@cronus/*` packages
- [x] T004 [P] [INFRA] Configure linting — ESLint 9 flat config, Prettier, lint-staged + husky pre-commit hook
- [x] T005 [P] [INFRA] Configure Vitest — root config, per-workspace configs, coverage thresholds
- [x] T006 [P] [INFRA] Create `packages/config/src/index.ts` — environment variable loading with zod validation, typed config object for all services
- [x] T007 [P] [INFRA] Create `packages/logger/src/index.ts` — structured JSON logging with pino, request-id propagation, log levels per environment
- [x] T008 [INFRA] Create `infra/docker/docker-compose.yml` — PostgreSQL 16 (with pgvector), Redis 7, Temporal dev server, MinIO (S3-compatible storage)
- [x] T009 [INFRA] Create `infra/scripts/dev-setup.sh` — bootstraps local dev: starts Docker services, runs migrations, seeds test data

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, shared domain, API skeleton, storage, queue — BLOCKS all user stories

- [x] T010 [INFRA] Create `packages/domain/src/index.ts` — shared TypeScript types for all 9 entities (Brand, Agency, NaturalCenter, Asset, Fragment, ContentUnit, PublishEvent, PerformanceObservation, PlatformConnection), enums (MediaType, Platform, ApprovalStatus, ProcessingStatus, PublishStatus), and constants
- [x] T011 [INFRA] Create `packages/db/src/schema/` — Drizzle ORM table definitions for all 9 entities per data-model.md: `brands.ts`, `agencies.ts`, `natural-centers.ts`, `assets.ts`, `fragments.ts`, `content-units.ts`, `publish-events.ts`, `performance-observations.ts`, `platform-connections.ts`
- [x] T012 [INFRA] Create `packages/db/src/migrations/0001_initial.sql` — full schema migration with all tables, foreign keys (ON DELETE RESTRICT for lineage), indexes, pgvector extension, `asset_attribution` view
- [x] T013 [INFRA] Create `packages/db/src/client.ts` — Drizzle client factory, connection pooling, transaction helper
- [x] T014 [P] [INFRA] Create `packages/storage/src/index.ts` — object storage abstraction: `upload(key, buffer)`, `download(key)`, `getSignedUrl(key)`. Local filesystem adapter for dev, S3/MinIO adapter for production
- [x] T015 [P] [INFRA] Create `packages/queue/src/index.ts` — BullMQ job definitions, typed job creators for: `asset.process`, `nc.derive`, `content.generate`, `content.score`, `publish.schedule`, `analytics.collect`. Queue connection factory, worker base class
- [x] T016 [INFRA] Create `apps/api/src/server.ts` — Fastify server with CORS, request logging, error handler, JSON schema validation, graceful shutdown. Register route prefixes: `/api/v1/brands`, `/api/v1/jobs`
- [x] T017 [INFRA] Create `apps/api/src/plugins/auth.ts` — API key authentication plugin (simple bearer token for MVP, expandable to OAuth later)
- [x] T018 [P] [INFRA] Create `apps/api/src/routes/brands.ts` — CRUD routes for Brand entity: `POST /brands`, `GET /brands`, `GET /brands/:id` per contracts/api.yaml
- [x] T019 [P] [INFRA] Create `apps/api/src/routes/jobs.ts` — `GET /jobs/:id` route returning job status from BullMQ

**Checkpoint**: Foundation ready — Docker services running, database migrated, API serving brand CRUD, storage and queue operational. All user story work can now begin.

---

## Phase 3: User Story 1 — Asset Upload & Content Generation (Priority: P1)

**Goal**: Upload asset → extract fragments → generate 30+ platform-native posts with captions
**Independent Test**: Upload 60s video, receive 30+ posts across 4 platforms with lineage and NC scores (quickstart.md Scenario B)

### Implementation

- [x] T020 [US1] Create `services/asset-ingestion/src/index.ts` — asset upload handler: validate file type/size (FR-001: MP4/MOV/PNG/JPG/TIFF, ≤2GB), store to object storage, create Asset record (status: uploaded), enqueue `asset.process` job
- [x] T021 [US1] Create `apps/api/src/routes/assets.ts` — `POST /brands/:brandId/assets` (multipart upload), `GET /brands/:brandId/assets`, `GET /brands/:brandId/assets/:assetId` per contracts/api.yaml
- [x] T022 [US1] Create `services/fragment-extraction/src/video.ts` — FFmpeg-based video extraction: scene detection (via `ffprobe` + threshold), clip extraction at scene boundaries, keyframe extraction at configurable interval, audio extraction for transcription input. Output: Fragment records (type: clip/keyframe) with storage keys
- [x] T023 [US1] Create `services/fragment-extraction/src/image.ts` — Sharp-based image extraction: crop regions of interest, aspect-ratio variants, focal point detection. Output: Fragment records (type: crop) with storage keys
- [x] T024 [US1] Create `services/fragment-extraction/src/transcription.ts` — Whisper API integration: extract audio from video (FFmpeg), send to Whisper API, parse transcript into text hooks (quotable sentences, key phrases). Output: Fragment records (type: text_hook)
- [x] T025 [US1] Create `services/fragment-extraction/src/index.ts` — orchestration: dispatch to video/image/transcription extractors based on asset media_type, collect all fragments, update asset status to `extracted`, update fragment_count
- [x] T026 [US1] Create `services/content-generation/src/index.ts` — for each fragment × target platform: construct Claude API prompt (system prompt from NC, fragment context, platform format constraints), generate caption + media selection, create ContentUnit record with nc_score placeholder
- [x] T027 [US1] Create `services/content-generation/src/prompts.ts` — prompt templates per platform: Instagram (casual, hashtags, emoji-light), LinkedIn (professional, thought-leadership), TikTok (hook-first, trend-aware), X (concise, thread-ready), YouTube Shorts (description + tags)
- [x] T028 [US1] Create `services/content-generation/src/formatter.ts` — platform-specific media formatting: Instagram Feed (1:1, 4:5), Instagram Story/Reels (9:16), LinkedIn (1.91:1 or 1:1), TikTok (9:16), X (16:9), YouTube Shorts (9:16). Uses Sharp for image resizing, FFmpeg for video re-encoding
- [x] T029 [US1] Create `services/scoring/src/index.ts` — NC alignment scoring: compute cosine similarity between generated content embedding and brand embedding (pgvector), produce nc_score (0-1) and nc_score_breakdown per dimension. Flag content below consistency_threshold
- [x] T030 [US1] Create `services/content-generation/src/dedup.ts` — similarity deduplication: compute perceptual hash for generated media, compare against existing units for same asset, reject duplicates above similarity threshold
- [x] T031 [US1] Create `apps/api/src/routes/content.ts` — `POST /brands/:brandId/generate` (starts async generation), `GET /brands/:brandId/content` (list with filters), `POST .../approve`, `POST .../reject` per contracts/api.yaml
- [x] T032 [US1] Create `apps/api/src/routes/fragments.ts` — `GET /brands/:brandId/assets/:assetId/fragments` per contracts/api.yaml
- [x] T033 [US1] Create `infra/temporal/workflows/asset-processing.ts` — Temporal workflow: assetUpload → validate → store → extractFragments → scoreFragments → updateAsset. Retry policy, timeout handling
- [x] T034 [US1] Create `infra/temporal/workflows/content-generation.ts` — Temporal workflow: loadNC → selectFragments → forEachPlatform(generatePosts) → scoreAll → flagLowNC → storeUnits. Rate limiting on Claude API calls

**Checkpoint**: Layer 1 core — upload a video, get 30+ posts with NC scores and lineage. Validate with quickstart.md Scenarios B, C, D.

---

## Phase 4: User Story 2 — Brand Identity Setup (Priority: P1)

**Goal**: Bootstrap computable brand identity (Natural Center) from one asset + optional text inputs
**Independent Test**: Provide one video + tone description, get NC profile with 3+ confident dimensions (quickstart.md Scenario A)

### Implementation

- [x] T035 [US2] Create `services/natural-center/src/derive.ts` — NC derivation pipeline: extract visual features (color palette, composition style via Claude Vision), extract tonal features (from transcription + tone_description), extract thematic features (topic clustering from captions/transcripts), compute per-dimension embeddings, synthesize brand_embedding (pgvector 1536-dim), estimate confidence per dimension
- [x] T036 [US2] Create `services/natural-center/src/prompt.ts` — Claude system prompt compiler: convert NC object into a structured system prompt for content generation. Includes: thematic constraints, tone instructions, aesthetic guidelines, negative-space prohibitions, example outputs
- [x] T037 [US2] Create `services/natural-center/src/refine.ts` — NC refinement: accept user adjustments (e.g., "more playful tone"), re-derive affected dimensions, increment version, recompile system prompt
- [x] T038 [US2] Create `services/natural-center/src/confidence.ts` — confidence estimation: per-dimension scoring based on input volume and signal consistency. Flag dimensions below 0.5 confidence with specific improvement suggestions ("upload more video content to strengthen aesthetic signature")
- [x] T039 [US2] Create `apps/api/src/routes/natural-center.ts` — `GET /brands/:brandId/natural-center`, `POST /brands/:brandId/natural-center` (derive), `PATCH /brands/:brandId/natural-center` (refine) per contracts/api.yaml
- [x] T040 [US2] Create `infra/temporal/workflows/nc-derivation.ts` — Temporal workflow: deriveNC → extractSignals → clusterThemes → computeEmbedding → validateConfidence → storeNC. Handles multi-asset derivation

**Checkpoint**: Layer 1 complete — brand identity bootstraps from one asset, governs all content generation. Validate with quickstart.md Scenario A. Combined with Phase 3: the irreducible closed loop works end-to-end.

---

## Phase 5: User Story 3 — Multi-Platform Scheduling (Priority: P2)

**Goal**: Schedule approved posts, publish automatically at optimal times, track calendar
**Independent Test**: Connect Instagram, approve 7 posts, verify automatic publishing over 7 days (quickstart.md Scenario E)

### Implementation

- [x] T041 [US3] Create `services/platform-adapter/src/interface.ts` — adapter interface: `authenticate(config)`, `formatContent(unit, spec)`, `publish(unit, connection)`, `fetchMetrics(postId, connection)`, `getFormatSpec(platform)`, `checkRateLimit(connection)`
- [x] T042 [P] [US3] Create `services/platform-adapter/src/adapters/instagram.ts` — Instagram Graph API adapter: OAuth flow, media upload (image/video/carousel), caption posting, metrics fetching, rate limit tracking. Handle container creation workflow for reels
- [x] T043 [P] [US3] Create `services/platform-adapter/src/adapters/linkedin.ts` — LinkedIn API adapter: OAuth 2.0, image/article/video posts, UGC API for publishing, analytics API for metrics
- [ ] T044 [P] [US3] Create `services/platform-adapter/src/adapters/x.ts` — X (Twitter) API v2 adapter: OAuth 2.0 PKCE, tweet/thread posting, media upload, engagement metrics
- [ ] T045 [P] [US3] Create `services/platform-adapter/src/adapters/tiktok.ts` — TikTok Content Publishing API: OAuth, video upload, caption posting, metrics
- [ ] T046 [P] [US3] Create `services/platform-adapter/src/adapters/youtube.ts` — YouTube Data API v3: OAuth, Shorts upload, title/description/tags, analytics
- [x] T047 [US3] Create `services/scheduler/src/index.ts` — scheduling engine: given approved content units + date range + strategy (optimal/evenly_distributed/manual), compute publish times per platform. Optimal strategy uses platform-specific best-time heuristics. Create PublishEvent records
- [x] T048 [US3] Create `apps/api/src/routes/schedule.ts` — `POST /brands/:brandId/schedule`, `GET /brands/:brandId/calendar` per contracts/api.yaml
- [x] T049 [US3] Create `apps/api/src/routes/platforms.ts` — `GET /brands/:brandId/platforms`, `GET /brands/:brandId/platforms/connect/:platform` (OAuth initiation), OAuth callback handler
- [x] T050 [US3] Create `infra/temporal/workflows/publishing.ts` — Temporal workflow: for each scheduled PublishEvent, sleep until scheduled_at, format content for platform, publish via adapter, record result (published/failed), retry on failure (max 3 with exponential backoff)

**Checkpoint**: Layer 2 publishing — approved content publishes automatically across platforms. Calendar view works. Validate with quickstart.md Scenario E.

---

## Phase 6: User Story 4 — Performance Tracking & Attribution (Priority: P2)

**Goal**: Collect engagement metrics, attribute through lineage, generate weekly reports
**Independent Test**: After 7 days of publishing, view report with per-asset attribution (quickstart.md Scenario F)

### Implementation

- [x] T051 [US4] Create `services/analytics/src/collector.ts` — metrics collection: for each published post, call platform adapter `fetchMetrics()`, create PerformanceObservation records. Schedule periodic collection (every 6 hours for first 7 days, then daily)
- [x] T052 [US4] Create `services/analytics/src/normalizer.ts` — cross-platform normalization: map platform-specific metrics to common schema, compute normalized_score (0-1) for cross-platform comparison. Normalization formula accounts for platform audience size differences
- [x] T053 [US4] Create `services/analytics/src/attribution.ts` — lineage roll-up: aggregate PerformanceObservation → PublishEvent → ContentUnit → Fragment → Asset. Compute per-asset metrics: total_views, total_engagement, engagement_rate, content_yield_ratio. Compute per-fragment metrics: which fragments produced highest-performing content
- [x] T054 [US4] Create `services/analytics/src/report.ts` — weekly report generator: query attribution data for date range, compute top-performing fragments, compute audience growth trajectory, format as WeeklyReport object per contracts/api.yaml schema
- [x] T055 [US4] Create `apps/api/src/routes/analytics.ts` — `GET /brands/:brandId/reports/weekly`, `GET /brands/:brandId/assets/:assetId/attribution` per contracts/api.yaml
- [x] T056 [US4] Create `infra/temporal/workflows/analytics-collection.ts` — Temporal workflow: scheduled cron (every 6h), for each brand with published content, collect metrics from all platforms, normalize, store observations. Weekly: trigger report generation

**Checkpoint**: Layer 2 complete — full closed loop operational. Upload → generate → schedule → publish → measure → attribute. Validate with quickstart.md Scenario F.

---

## Phase 7: User Story 5 — Multi-Format Design Resizing (Priority: P3)

**Goal**: Upload one design, get correctly sized variants for all target formats
**Independent Test**: Upload 1080x1080 ad, get 9 format variants with preserved visual hierarchy (quickstart.md Scenario G)

### Implementation

- [x] T057 [US5] Create `services/design-resizer/src/formats.ts` — format registry: all standard ad/social dimensions with metadata (name, width, height, aspect_ratio, safe_zones, max_file_size). Instagram, Facebook, LinkedIn, X, YouTube, Google Display formats
- [x] T058 [US5] Create `services/design-resizer/src/analyzer.ts` — design analysis: detect focal point (saliency map via Sharp), identify text regions (via Claude Vision), extract color palette, determine visual hierarchy (primary/secondary/tertiary elements)
- [x] T059 [US5] Create `services/design-resizer/src/resizer.ts` — intelligent resizing: given source design + analysis + target format, compute crop/recomposition that preserves focal point within safe zone, maintains text legibility, respects brand NC color/style constraints. Sharp for execution
- [x] T060 [US5] Create `apps/api/src/routes/resize.ts` — `POST /brands/:brandId/resize` (multipart upload + target_formats array), returns job_id per contracts/api.yaml
- [x] T061 [US5] Create `services/design-resizer/src/index.ts` — orchestration: analyze source → for each target format → resize → score against NC → store variants → return results

**Checkpoint**: Design resizing operational — Scott's use case works. Upload one ad, get all format variants. Validate with quickstart.md Scenario G.

---

## Phase 8: User Story 6 — Agency White-Label Dashboard (Priority: P3)

**Goal**: Multi-client management with isolated brands, aggregate dashboard, white-label reports
**Independent Test**: Two brands under one agency, content generated for both, isolated with aggregate view (quickstart.md Scenario H)

### Implementation

- [x] T062 [US6] Create `apps/api/src/routes/agencies.ts` — CRUD for Agency entity, link brands to agency
- [ ] T063 [US6] Create `apps/dashboard/src/pages/agency/Dashboard.tsx` — aggregate metrics view: all clients, per-client breakdowns, total posts, total engagement, revenue attribution
- [ ] T064 [US6] Create `apps/dashboard/src/pages/agency/ClientList.tsx` — client management: create/archive clients, view individual client dashboards
- [ ] T065 [US6] Create `apps/dashboard/src/pages/brand/ContentCalendar.tsx` — visual calendar with post previews, status indicators, drag-to-reschedule
- [ ] T066 [US6] Create `apps/dashboard/src/pages/brand/IdentityProfile.tsx` — NC visualization: radar chart for dimension confidence, editable parameters, regenerate button
- [ ] T067 [US6] Create `apps/dashboard/src/pages/brand/PerformanceReport.tsx` — weekly report view: asset attribution table, top fragments, engagement trends, exportable PDF with agency branding
- [ ] T068 [US6] Create `apps/dashboard/src/pages/brand/ContentReview.tsx` — review queue: grid of generated posts, approve/reject actions, NC score indicators, platform preview
- [ ] T069 [US6] Create `apps/dashboard/src/services/api.ts` — typed API client generated from contracts/api.yaml (OpenAPI → TypeScript with openapi-typescript)
- [ ] T070 [US6] Create `apps/dashboard/src/App.tsx` — React Router setup, layout with sidebar navigation, agency/brand context switching, auth wrapper

**Checkpoint**: Layer 3 complete — full agency dashboard with multi-client management. Validate with quickstart.md Scenario H.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, documentation, deployment readiness

- [x] T071 [P] [INFRA] Create `infra/docker/Dockerfile` — multi-stage build for API service
- [ ] T072 [P] [INFRA] Create deployment configuration for Railway/Render — environment variables, PostgreSQL addon, Redis addon, persistent storage
- [x] T073 [P] [INFRA] Create `apps/cli/src/index.ts` — operator CLI: `cronus upload <file>`, `cronus generate <brand>`, `cronus report <brand>`, `cronus status`. Enables Layer 1 operation without dashboard
- [ ] T074 [INFRA] Run full quickstart.md validation (Scenarios A through H)
- [ ] T075 [INFRA] Security hardening — encrypt platform tokens at rest, sanitize file uploads, rate limit API endpoints, validate all input with Fastify JSON schema
- [ ] T076 [P] [INFRA] Update project README.md with setup instructions, architecture overview, quickstart
- [ ] T077 [P] [INFRA] Update CLAUDE.md with build/test/lint commands for the implemented system

---
...
