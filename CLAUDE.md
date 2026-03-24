# CLAUDE.md

## What This Is

AI content engine that takes premium visual assets (hero films, 3D renders, product photography) and auto-generates 30+ days of platform-optimized social content. Built as a partnership between Padavano (engineering) and Lefler Design (UI/UX, marketing, sales).

**Organ:** III (Ergon) — Commerce
**Status:** Pre-MVP skeleton

## Architecture

```
src/
  api/          # REST API (Fastify)
  pipeline/     # AI processing pipeline (clip extraction, caption gen, scheduling)
  social/       # Platform adapters (Instagram, LinkedIn, TikTok, YouTube, X)
  analytics/    # Engagement tracking and ROI reporting
tests/          # Vitest
docs/           # Architecture docs, API reference
```

## Key Concepts

- **Asset ingestion:** Upload video/images, AI analyzes for high-energy moments and content opportunities
- **Content generation:** FFmpeg for clip extraction, Claude API for captions in brand voice, layout generation for carousels
- **Distribution:** Per-platform adapters with rate limit handling, optimal timing
- **Reporting:** Weekly engagement metrics, content performance ranking, ROI per source asset

## Commands

```bash
npm install
npm run dev          # Dev server
npm test             # Vitest
npm run build        # Production build
```

## Partnership Context

Full partnership details, origin story, and pipeline entry in:
`~/Workspace/4444J99/application-pipeline/strategy/partnership-lefler-padavano-content-engine.md`
