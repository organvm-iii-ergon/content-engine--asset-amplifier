# Content Engine — Asset Amplifier

**AI-powered content repurposing and distribution platform for premium brands.**

Takes one premium visual asset (hero film, 3D render, product shoot) and generates 30+ days of platform-optimized social content automatically.

---

## Status: Pre-MVP

- **Organ:** III (Ergon) — Commerce
- **Partners:** Padavano (engineering) + Lefler (design/marketing/sales)
- **Origin:** Partnership formed 2026-03-23

## The Problem

Premium brands pay $15-50K for hero films and product renders. These assets get used once. Meanwhile marketing teams spend 20+ hrs/week manually creating social content.

## What It Does

1. **Ingest** a premium video or render set
2. **AI extracts** 10-15 short clips at high-energy moments, resized per platform
3. **AI generates** captions in brand voice, hashtag strategy, optimized schedule
4. **Distributes** to Instagram, LinkedIn, TikTok, YouTube Shorts, X
5. **Reports** weekly engagement metrics tied to content ROI

## Stack (proposed)

- Frontend: Next.js 15 + React 19 + Tailwind
- Backend: Node.js/TypeScript (Fastify)
- Database: PostgreSQL (Neon)
- Queue: BullMQ + Redis
- AI/ML: FFmpeg, Whisper/Deepgram, Claude API, PySceneDetect
- Storage: Cloudflare R2
- Social APIs: Meta Graph, LinkedIn, TikTok, YouTube Data
- Deploy: Vercel (frontend) + Railway (workers)

## Quick Start

```bash
# TBD — skeleton only
npm install
npm run dev
```

## License

MIT
