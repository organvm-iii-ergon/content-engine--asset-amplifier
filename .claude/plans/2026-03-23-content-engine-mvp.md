# Content Engine MVP — Build Plan

**Date:** 2026-03-23
**Partners:** Padavano (engineering) + Lefler (design/marketing/sales)

---

## MVP Scope (ship in 4-6 weeks)

### 1. Smart Asset Ingestion
- Upload video (MP4, MOV) or images (PNG, JPG, PSD)
- AI analyzes content: detects high-energy moments, scene changes, product close-ups, text overlays
- Extracts metadata: duration, aspect ratio, color palette, mood

### 2. AI Content Generation

**Video to Clips:**
- Extract 10-15 short clips (6s, 15s, 30s, 60s) optimized for Reels/TikTok/Stories
- Cut at high-energy moments (audio peaks, scene transitions, product reveals)
- Auto-add captions/subtitles
- Resize for each platform (9:16, 1:1, 16:9)

**Images to Layouts:**
- Generate carousel posts, before/after comparisons, feature callouts
- Auto-crop for platform-specific sizes
- Generate text overlay variants

**AI Captions:**
- Generate 10-15 unique captions per asset
- Brand voice training (upload 10 existing posts, AI learns tone)
- Hashtag strategy (industry-relevant, trending, branded)
- CTA variants (engagement, traffic, conversion)

**Posting Schedule:**
- Optimized by platform-specific best times
- Audience timezone analysis
- Content mix rotation (video/image/carousel)

### 3. One-Click Distribution
- Connect accounts: Instagram, LinkedIn, TikTok, YouTube Shorts, X, Facebook
- Preview all generated content before scheduling
- Bulk approve or edit individual posts
- Auto-publish on schedule

### 4. Weekly Report
- Engagement metrics per post and per platform
- Content performance ranking (which clips/captions performed best)
- Audience growth tracking
- ROI calculation: impressions and engagement per dollar of original content investment

---

## Technical Stack

- **Frontend:** Next.js 15 + React 19 + Tailwind (Scott designs, Padavano builds)
- **Backend:** Node.js/TypeScript (Fastify)
- **Database:** PostgreSQL (Neon serverless)
- **Queue:** BullMQ + Redis for async video processing
- **AI/ML Pipeline:**
  - FFmpeg for video processing (clip extraction, resize, format conversion)
  - Whisper or Deepgram API for audio transcription and subtitle generation
  - Claude API for caption generation and brand voice training
  - PySceneDetect or custom frame-diff analysis for scene detection
- **Storage:** Cloudflare R2 or AWS S3
- **Auth:** Clerk or Auth.js
- **Deployment:** Vercel (frontend) + Railway/Render (backend workers)
- **Social APIs:** Meta Graph API (IG/FB), LinkedIn API, TikTok API, YouTube Data API

### Key Technical Decisions
- Video processing is compute-heavy — async workers, not request/response
- AI caption generation batched (generate 15, user picks favorites)
- Brand voice training = fine-tuned prompt with 10+ example posts as few-shot context
- Start with ffmpeg + scene detection for clip extraction (no custom ML needed for MVP)
- Social API rate limits vary — per-platform adapters with circuit breakers

---

## Business Model

| Tier | Price | Assets/mo | Platforms | Features |
|------|-------|-----------|-----------|----------|
| Starter | $99/mo | 5 | 3 | Basic analytics |
| Pro | $299/mo | 25 | All | Advanced analytics, brand voice |
| Agency | $799/mo | Unlimited | All | White-label, multi-brand, client portal |
| Enterprise | Custom | Custom | All | Dedicated support, custom integrations |

---

## Go-to-Market

### Phase 1: Dogfood (weeks 1-6)
- Build MVP
- Scott runs it on Lefler.Design socials
- Padavano runs it on ORGANVM content
- Document everything (build in public)

### Phase 2: Beta (weeks 7-10)
- Offer to 3-5 of Scott's existing clients as free add-on
- Collect testimonials and usage data
- Refine based on real feedback

### Phase 3: Launch (weeks 11-14)
- Scott's network + build-in-public audience
- ProductHunt launch
- Agency-focused content marketing
- Case studies from beta clients with real metrics

---

## Success Metrics (90-day)

| Metric | Target |
|--------|--------|
| Both partners using daily | Yes |
| Beta clients | 5 |
| Paying clients | 3 |
| MRR | $1,000+ |
| Content generated per source asset | 15+ pieces |
| Time saved per client per week | 15+ hrs |

---

## Open Questions for Scott
1. Product name?
2. Build under Lefler.Design brand, new brand, or white-label from day 1?
3. Best beta candidates from current clients?
4. Revenue/equity split?
5. Time commitment for UI/design in first 6 weeks?
