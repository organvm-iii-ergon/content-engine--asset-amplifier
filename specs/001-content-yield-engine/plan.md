# Implementation Plan: Content Yield Engine (Cronus Metabolus)

**Branch**: `001-content-yield-engine` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-content-yield-engine/spec.md`

## Summary

AI content yield engine that transforms one premium visual asset into 30-90 days of platform-optimized social content with full-lineage attribution and computable brand identity enforcement. Built as a layered wedding cake: each layer is complete, sellable, and load-bearing for the next. TypeScript monorepo with Fastify API, Claude for generation, FFmpeg for extraction, PostgreSQL + pgvector for data, Redis/BullMQ for queues, Temporal for orchestration, React/Vite for dashboard.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 25.x
**Primary Dependencies**: Fastify, Anthropic SDK, fluent-ffmpeg, Sharp, Temporal TypeScript SDK, BullMQ, Drizzle ORM
**Storage**: PostgreSQL 16 with pgvector, Redis 7, S3-compatible object storage (local MinIO → cloud)
**Testing**: Vitest (unit + integration), Playwright (E2E for dashboard)
**Target Platform**: Linux server (Docker), macOS for development
**Project Type**: Monorepo (pnpm workspaces + Turborepo)
**Performance Goals**: Asset processing < 10 min per minute of video; content generation < 15 min for 30+ posts
**Constraints**: Single-operator deployment initially (Padavano + Lefler), scaling to multi-tenant
**Scale/Scope**: 1-10 brands initially, 50-100 at agency scale

## Project Structure

### Documentation (this feature)

```
specs/001-content-yield-engine/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Technology research and decisions
├── data-model.md        # Entity definitions with SQL
├── quickstart.md        # Validation scenarios per layer
├── contracts/
│   └── api.yaml         # OpenAPI 3.1 specification
└── checklists/
    └── requirements.md  # Quality validation
```

### Source Code (repository root)

```
apps/
├── api/                    # Fastify REST API (Layer 1)
│   ├── src/
│   │   ├── routes/         # Route handlers by domain
│   │   ├── plugins/        # Fastify plugins (auth, validation)
│   │   └── server.ts       # Entry point
│   └── tests/
├── dashboard/              # React/Vite frontend (Layer 2-3)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── tests/
└── cli/                    # CLI for operator workflows (Layer 1)
    └── src/

services/
├── asset-ingestion/        # Upload, validate, store (Layer 1)
│   └── src/
├── fragment-extraction/    # FFmpeg + scene detection (Layer 1)
│   └── src/
├── natural-center/         # Brand identity derivation (Layer 1)
│   └── src/
├── content-generation/     # Claude API + post formatting (Layer 1)
│   └── src/
├── scoring/                # NC alignment scoring (Layer 1)
│   └── src/
├── platform-adapter/       # Per-platform publish/metrics (Layer 2)
│   ├── src/
│   │   ├── adapters/       # instagram.ts, linkedin.ts, tiktok.ts, ...
│   │   └── interface.ts    # Common adapter interface
│   └── tests/
├── scheduler/              # Optimal timing + queue (Layer 2)
│   └── src/
├── analytics/              # Metrics collection + attribution (Layer 2)
│   └── src/
├── design-resizer/         # Multi-format design transformation (Layer 3)
│   └── src/
└── audience-engine/        # State transitions + optimization (Layer 3+)
    └── src/

packages/
├── domain/                 # Shared types, enums, constants
│   └── src/
├── db/                     # Drizzle schema, migrations, client
│   ├── src/
│   │   ├── schema/         # Table definitions
│   │   └── migrations/
│   └── drizzle.config.ts
├── queue/                  # BullMQ job definitions + helpers
│   └── src/
├── storage/                # Object storage abstraction (local FS → S3)
│   └── src/
├── logger/                 # Structured logging
│   └── src/
└── config/                 # Environment loading + validation
    └── src/

infra/
├── temporal/
│   ├── workflows/          # Temporal workflow definitions
│   └── activities/         # Temporal activity implementations
├── docker/
│   ├── docker-compose.yml  # PostgreSQL, Redis, Temporal, MinIO
│   └── Dockerfile
└── scripts/
    ├── seed.ts             # Dev data seeding
    └── migrate.ts          # DB migration runner

tests/
├── contract/               # API contract tests (from OpenAPI)
├── integration/            # Cross-service integration
└── e2e/                    # Full pipeline tests
```

**Structure Decision**: Monorepo with `apps/`, `services/`, `packages/`, `infra/` — mirrors the genesis corpus repository architecture. Every service from the full 24-service blueprint has a directory, even if it starts empty. We fill, not restructure.

## Wedding Cake Layers

Each layer is independently deployable, sellable, and complete.

### Layer 1: The Closed Loop (US1 + US2)

**What ships**: Upload asset → extract fragments → derive brand identity → generate 30+ posts → review calendar
**What sells**: "Give us your video, we give you 90 days of content."
**Services built**: asset-ingestion, fragment-extraction, natural-center, content-generation, scoring
**Revenue surface**: Per-asset content generation fee, or included in retainer pitch

### Layer 2: The Attribution Engine (US3 + US4)

**What ships**: Schedule → publish → collect metrics → weekly report with asset-level ROI
**What sells**: "We post it for you and show you what it earned."
**Services built**: platform-adapter, scheduler, analytics
**Revenue surface**: Monthly retainer ($2-5K/month) with performance reporting

### Layer 3: Scale + Design (US5 + US6)

**What ships**: Design resizing + agency multi-client dashboard + white-label reports
**What sells**: "Manage all your clients from one place. Resize all your ads automatically."
**Services built**: design-resizer, audience-engine, dashboard (full)
**Revenue surface**: Agency white-label ($200-550K ARR), per-resize fees

## Temporal Workflow Architecture

The genesis corpus defines 5 workflow families. For planning purposes:

### Asset Processing Workflow (Layer 1)
```
assetUpload → validate → store → extractFragments → scoreFragments → updateAsset(status: extracted)
```

### Natural Center Derivation Workflow (Layer 1)
```
deriveNC → extractSignals(assets) → clusterThemes → computeEmbedding → validateConfidence → storeNC
```

### Content Generation Workflow (Layer 1)
```
generateContent → loadNC → selectFragments → forEachPlatform(generatePosts) → scoreAll → flagLowNC → storeUnits
```

### Publishing Workflow (Layer 2)
```
schedulePost → waitUntilTime → formatForPlatform → publish → recordEvent → scheduleMetricsCollection
```

### Analytics Collection Workflow (Layer 2)
```
collectMetrics → forEachPublished(fetchPlatformMetrics) → normalizeMetrics → storeObservations → generateWeeklyReport
```
