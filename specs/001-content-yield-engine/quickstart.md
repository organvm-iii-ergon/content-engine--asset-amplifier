# Quickstart: Content Yield Engine Validation

## Layer 1 Validation (US1 + US2)

### Scenario A: Brand Bootstrap from One Asset

**Goal**: Verify that one uploaded asset produces a brand identity profile.

1. Create a brand: `POST /api/v1/brands` with `{ "name": "Test Brand", "tone_description": "Professional but approachable, modern tech" }`
2. Upload a 60-second product video: `POST /api/v1/brands/{id}/assets` (multipart, media_type: video)
3. Wait for processing: `GET /api/v1/jobs/{jobId}` until status = completed
4. Derive Natural Center: `POST /api/v1/brands/{id}/natural-center` with `{ "asset_ids": ["{assetId}"] }`
5. Wait for derivation: `GET /api/v1/jobs/{jobId}` until status = completed
6. Inspect result: `GET /api/v1/brands/{id}/natural-center`

**Expected**: Natural Center with at least 3 of 5 dimensions at confidence > 0.5. Human-readable thematic_core, aesthetic_signature, and tonal_vector.

### Scenario B: Content Generation Pipeline

**Goal**: Verify one asset produces 30+ platform-formatted posts.

1. Complete Scenario A (brand + asset + NC exist)
2. Generate content: `POST /api/v1/brands/{id}/generate` with `{ "asset_id": "{assetId}", "platforms": ["instagram_feed", "instagram_reels", "linkedin", "x"] }`
3. Wait for generation: `GET /api/v1/jobs/{jobId}` until status = completed
4. List content: `GET /api/v1/brands/{id}/content`

**Expected**: 30+ content units. Each has: caption, platform target, nc_score > brand's consistency_threshold (0.75 default), fragment_id linking to source. No two units have identical similarity_hash.

### Scenario C: Brand Consistency Enforcement

**Goal**: Verify flagging when NC score is below threshold.

1. Complete Scenario B
2. Count content with `approval_status = flagged`: `GET /api/v1/brands/{id}/content?approval_status=flagged`

**Expected**: Any post with nc_score < 0.75 has approval_status = "flagged" with flagged_reason. All posts with nc_score >= 0.75 have approval_status = "pending" (awaiting human review).

### Scenario D: Lineage Traceability

**Goal**: Verify full lineage from content unit back to source asset.

1. Pick any content unit from Scenario B
2. Inspect its fragment_id → `GET /api/v1/brands/{id}/assets/{assetId}/fragments`
3. Verify fragment has asset_id pointing to the uploaded asset

**Expected**: content_unit.fragment_id → fragment.asset_id → asset.id forms an unbroken chain.

## Layer 2 Validation (US3 + US4)

### Scenario E: Scheduling and Publishing

**Goal**: Verify approved content publishes to a connected platform.

1. Connect a platform: `GET /api/v1/brands/{id}/platforms/connect/instagram` (OAuth flow)
2. Approve content units: `POST /api/v1/brands/{id}/content/{unitId}/approve` (for 7 units)
3. Schedule: `POST /api/v1/brands/{id}/schedule` with `{ "content_unit_ids": [...], "strategy": "evenly_distributed", "start_date": "2026-04-01", "end_date": "2026-04-07" }`
4. View calendar: `GET /api/v1/brands/{id}/calendar`

**Expected**: 7 publish events, one per day, status = "scheduled". Calendar shows all 7 with platform, time, and content preview.

### Scenario F: Weekly Attribution Report

**Goal**: Verify engagement rolls up through lineage to source asset.

1. After 7+ days of published content
2. Generate report: `GET /api/v1/brands/{id}/reports/weekly?week_of=2026-04-07`

**Expected**: Report shows per-asset attribution (views, engagement, yield ratio). Top-performing fragments identified. Cross-platform metrics normalized.

## Layer 3 Validation (US5 + US6)

### Scenario G: Design Resizing

**Goal**: Verify one design produces correctly sized variants.

1. Upload a 1080x1080 PNG ad creative: `POST /api/v1/brands/{id}/resize` with target_formats: [instagram_story_1080x1920, facebook_feed_1200x628, display_300x250]
2. Wait for job completion
3. Download variants

**Expected**: 3 images at exact target dimensions. Focal point preserved. Text legible. Colors match brand NC profile.

### Scenario H: Agency Multi-Client

**Goal**: Verify brand isolation in multi-tenant mode.

1. Create agency: `POST /api/v1/agencies`
2. Create 2 brands under agency
3. Upload different assets to each brand
4. Generate content for both
5. Verify content units from Brand A reference only Brand A's NC and fragments

**Expected**: Complete isolation. Brand A's content has zero references to Brand B's data.
