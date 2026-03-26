# Feature Specification: Content Yield Engine (Cronus Metabolus MVP)

**Feature Branch**: `001-content-yield-engine`
**Created**: 2026-03-25
**Status**: Draft
**Input**: Genesis corpus (58 theoretical specs) + pitch deck narrative + Scott Lefler validation. System: AI content engine that takes one premium visual asset and auto-generates 30-90 days of platform-optimized social content with measurable attribution. Partnership: Padavano (engineering) + Lefler Design (UI/UX, marketing, sales).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Asset Upload and Content Generation (Priority: P1)

A brand owner or agency operator uploads a single premium asset (hero video, product render set, or photography batch). The system ingests the asset, extracts high-value fragments, generates platform-native social posts with brand-consistent captions, and presents the full content calendar for review before scheduling.

**Why this priority**: This is the irreducible closed loop. Without asset-to-content transformation, there is no product. One asset in, many posts out. Everything else is optimization on top of this.

**Independent Test**: Upload a 60-second product video. System produces 30+ platform-formatted posts (Instagram Reels, LinkedIn carousels, TikTok clips, X threads, YouTube Shorts) with captions. Each post traces back to a specific fragment of the source asset.

**Acceptance Scenarios**:

1. **Given** a user with an account, **When** they upload a 60-second MP4 video, **Then** the system extracts 10-15 fragments (clips, key frames, text hooks) within 10 minutes.
2. **Given** extracted fragments, **When** generation completes, **Then** at least 30 platform-formatted posts are produced, each tagged with source fragment ID and platform target.
3. **Given** generated posts, **When** the user views the content calendar, **Then** each post shows: preview, target platform, scheduled date, caption, and source fragment lineage.
4. **Given** a generated post, **When** a user inspects it, **Then** it includes a brand-consistency score indicating alignment with the brand's identity profile.
5. **Given** a brand with an existing identity profile, **When** content is generated, **Then** all posts score above the configured brand-consistency threshold or are flagged for review.

---

### User Story 2 - Brand Identity Setup (Priority: P1)

A new user onboards their brand by providing minimal inputs (one or more existing assets, brand guidelines if available, tone/voice description). The system derives a computable brand identity profile (Natural Center) that governs all future content generation, ensuring every output matches the brand's thematic, aesthetic, and tonal signature.

**Why this priority**: Co-equal with US1 because generation without identity constraint produces generic AI slop. The Natural Center is the differentiator — without it, this is Buffer with AI. The system must bootstrap identity from as little as one asset.

**Independent Test**: Provide one hero video and a 2-sentence brand description. System produces a brand identity profile. Generate 10 test posts. Verify thematic/tonal coherence across all 10 without manual correction.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they upload at least one asset and optionally provide brand guidelines, **Then** the system derives a brand identity profile within 5 minutes.
2. **Given** a derived brand identity, **When** the user reviews it, **Then** they see a human-readable summary of: thematic core, aesthetic signature, tonal vector, narrative bias, and symbolic markers.
3. **Given** a brand identity profile, **When** the user adjusts a parameter (e.g., "more playful tone"), **Then** the profile updates and the change propagates to future content generation.
4. **Given** a brand identity profile and new content generation, **When** outputs are scored, **Then** each output includes a brand-consistency score broken into sub-dimensions (thematic, aesthetic, tonal, narrative, symbolic).

---

### User Story 3 - Automated Multi-Platform Scheduling (Priority: P2)

After reviewing and approving generated content, the user schedules posts across connected social platforms. The system handles platform-specific formatting, rate limits, and optimal posting times. Content publishes automatically according to the calendar.

**Why this priority**: Scheduling is the bridge between generation and measurement. Without it, the loop is not closed. But it depends on US1 (content exists) and is a well-understood problem space.

**Independent Test**: Connect an Instagram Business account. Approve 7 posts. System schedules them across the next 7 days at optimal times and publishes automatically. Verify each published post matches the approved preview.

**Acceptance Scenarios**:

1. **Given** approved posts and a connected platform, **When** the scheduled time arrives, **Then** the post publishes automatically in the platform's native format.
2. **Given** a connected platform, **When** the system encounters a rate limit or API error, **Then** it retries with exponential backoff and notifies the user only if publication fails after 3 attempts.
3. **Given** a content calendar, **When** the user views it, **Then** they see all scheduled posts across all platforms with status indicators (pending, published, failed).
4. **Given** a generated post targeting Instagram, **When** it is formatted for publication, **Then** the aspect ratio, caption length, hashtag count, and media format comply with Instagram's current specifications.

---

### User Story 4 - Performance Tracking and Attribution (Priority: P2)

The system tracks engagement metrics for all published content and attributes performance back through the full lineage: published post → content unit → fragment → source asset. A weekly report shows ROI per source asset, top-performing fragments, and audience growth trajectory.

**Why this priority**: Attribution is what makes this a yield engine rather than a posting tool. Without it, clients cannot see ROI, and the business case for retainers collapses. But it requires US1 (content) and US3 (publishing) to be live first.

**Independent Test**: After 7 days of publishing from one source asset, view the performance report. Verify: (a) each post has engagement metrics, (b) metrics roll up to fragment and asset level, (c) a clear ROI indicator per source asset is displayed.

**Acceptance Scenarios**:

1. **Given** published posts with platform analytics connected, **When** 7 days elapse, **Then** the system produces a weekly performance report attributing engagement to source fragments and assets.
2. **Given** a performance report, **When** the user views asset-level attribution, **Then** they see: total reach, total engagement, engagement rate, estimated value, and content yield ratio (posts generated / posts that outperformed baseline).
3. **Given** multi-platform publishing, **When** metrics are aggregated, **Then** platform-specific metrics are normalized to a common scale for cross-platform comparison.
4. **Given** a performance report, **When** the user drills into a fragment, **Then** they see all posts derived from that fragment with individual performance metrics.

---

### User Story 5 - Multi-Format Design Resizing (Priority: P3)

A designer uploads a single ad creative or design asset. The system automatically generates correctly formatted variants for all required output sizes and platforms (social media dimensions, display ad sizes, print formats). Each variant preserves the design's visual hierarchy, typography, and brand identity.

**Why this priority**: Validated by Scott Lefler from his daily workflow — manually resizing hundreds of ad variants across formats for one campaign. Same transformation engine (1 source → N derivatives), different input type. Extends the content engine to design assets. Deferred to P3 because it requires the core transformation infrastructure from US1 to exist first.

**Independent Test**: Upload one 1080x1080 Instagram ad creative. System generates variants for: Instagram Story (1080x1920), Facebook Feed (1200x628), LinkedIn (1200x627), X (1600x900), YouTube Thumbnail (1280x720), and Google Display (300x250, 728x90, 160x600). Each variant preserves the design's focal point and readable text.

**Acceptance Scenarios**:

1. **Given** a single design asset, **When** the user selects target formats, **Then** the system generates correctly sized variants for each format within 2 minutes.
2. **Given** a generated variant, **When** the user reviews it, **Then** the visual hierarchy (primary focal point, headline, CTA) is preserved and legible at the target size.
3. **Given** a brand identity profile, **When** design variants are generated, **Then** colors, typography, and visual style match the brand profile.

---

### User Story 6 - Agency White-Label Dashboard (Priority: P3)

An agency operator manages multiple client brands from a single dashboard. Each client has isolated brand identity, content calendar, and performance reporting. The dashboard is white-labeled with the agency's branding, and weekly reports are auto-generated with the agency's logo and styling.

**Why this priority**: White-label is the agency sales multiplier — it's how the product scales to $200-550K ARR via retainers. But it requires the core product (US1-US4) to be proven before adding multi-tenancy.

**Independent Test**: Create two client brands under one agency account. Generate content for both. Verify: (a) brand identities are isolated, (b) content calendars are separate, (c) a combined agency-level dashboard shows aggregate metrics, (d) individual client reports carry the agency's branding.

**Acceptance Scenarios**:

1. **Given** an agency account, **When** the operator creates a new client, **Then** the client gets an isolated workspace with its own brand identity, content calendar, and analytics.
2. **Given** multiple clients, **When** the operator views the agency dashboard, **Then** they see aggregate metrics across all clients plus per-client breakdowns.
3. **Given** a client workspace, **When** a weekly report is generated, **Then** it carries the agency's branding (logo, colors, contact info), not the platform's.

---

### Edge Cases

- What happens when an uploaded asset has no audio track? (Extract visual fragments only; skip audio-derived text hooks)
- What happens when a platform API is temporarily unavailable? (Queue posts, retry with backoff, surface status in calendar)
- What happens when a brand identity profile has low confidence? (Flag to user with specific weak dimensions, suggest uploading more reference assets)
- How does the system handle assets in languages the AI models don't support? (Fall back to visual-only extraction; flag language limitation to user)
- What happens when two fragments produce near-identical posts? (Deduplicate at generation time using similarity threshold; present only distinct variants)
- What happens when a platform changes its API or format requirements? (Platform adapters are versioned; breaking changes trigger alerts to operators)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST ingest video (MP4, MOV), image (PNG, JPG, TIFF), and render set (multi-image batch) assets up to 2GB per file.
- **FR-002**: System MUST extract 10-15 fragments per minute of video, including clips, key frames, and text hooks derived from audio transcription.
- **FR-003**: System MUST generate platform-native posts for at least: Instagram (Feed, Story, Reels), LinkedIn, TikTok, YouTube Shorts, and X (Twitter).
- **FR-004**: System MUST produce brand-consistent captions using the brand's identity profile, with a measurable consistency score per post.
- **FR-005**: System MUST maintain full lineage: every generated post traces back through content unit → fragment → source asset.
- **FR-006**: System MUST derive a brand identity profile (Natural Center) from as few as one uploaded asset, with confidence scoring.
- **FR-007**: System MUST allow users to review and approve/reject generated posts before scheduling.
- **FR-008**: System MUST schedule and publish approved posts to connected platforms at configurable or AI-suggested optimal times.
- **FR-009**: System MUST handle platform rate limits and API errors with retry logic, without losing scheduled posts.
- **FR-010**: System MUST collect engagement metrics from connected platforms and attribute them through the full asset → fragment → post lineage.
- **FR-011**: System MUST generate weekly performance reports showing ROI per source asset, top-performing fragments, and audience growth metrics.
- **FR-012**: System MUST normalize cross-platform metrics to enable meaningful comparison (e.g., Instagram likes vs. LinkedIn reactions).
- **FR-013**: System MUST support multi-tenant operation where each brand/client has isolated identity, content, and analytics.
- **FR-014**: System MUST ensure all generated content scores above a configurable brand-consistency threshold, or flag it for human review.
- **FR-015**: System MUST support ad creative resizing — transforming one design asset into correctly formatted variants for multiple target dimensions.

### Key Entities

- **Asset**: The source material (video, image set, design file). Has: media type, duration/dimensions, upload date, owner, processing status.
- **Fragment**: A derived unit extracted from an asset. Has: source asset reference, type (clip, frame, crop, text hook), extraction metadata, quality score.
- **Natural Center (Brand Identity)**: Computable identity constraint for a brand. Has: thematic core, aesthetic signature, tonal vector, narrative bias, symbolic markers, negative-space rules, confidence score, version.
- **Content Unit**: A generated post ready for platform-specific formatting. Has: source fragment reference, caption text, visual content, brand-consistency score, platform target.
- **Publish Event**: A scheduled or completed publication. Has: content unit reference, target platform, scheduled time, status (pending/published/failed), platform post ID.
- **Performance Observation**: Engagement data for a published post. Has: publish event reference, metric type (views, engagement, reach, leads), value, observation timestamp.
- **Brand/Client**: A tenant in the system. Has: name, brand identity profile, connected platforms, content calendar, owner/agency.
- **Agency**: A multi-client operator. Has: branding (logo, colors), client list, aggregate dashboard access.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A single 60-second video produces at least 30 distinct, platform-formatted posts within 15 minutes of upload.
- **SC-002**: 95% of generated posts score above the configured brand-consistency threshold without manual editing.
- **SC-003**: A brand identity profile can be derived from one asset in under 5 minutes, with at least 3 of 5 identity dimensions at "usable" confidence.
- **SC-004**: Published content achieves at least 40% higher engagement rate than the client's historical manual posting average (measured over 30-day baseline).
- **SC-005**: Weekly performance reports attribute at least 90% of tracked engagement back to specific source assets and fragments.
- **SC-006**: An agency operator managing 5 clients spends no more than 2 hours per week on content management (vs. 15-25 hours manual baseline).
- **SC-007**: Design resizing produces usable variants (no text clipping, focal point preserved) for at least 90% of standard ad format dimensions.
- **SC-008**: The system reduces client content creation labor by at least 15 hours per week, as measured by time-tracking comparison.
