# Research: Content Yield Engine

## Monorepo Tooling

**Decision**: pnpm workspaces + Turborepo
**Rationale**: The genesis corpus specifies a monorepo with 24 services, 17 packages, and multiple apps. pnpm gives strict dependency isolation (no phantom deps), Turborepo gives incremental builds and task caching. npm workspaces lack strictness; Nx is heavier than needed. Turborepo is already used in two ORGAN-III projects (peer-audited--behavioral-blockchain, life-my--midst--in).
**Alternatives Considered**: npm workspaces (too permissive), Nx (over-complex for this stage), Lerna (deprecated pattern)

## API Framework

**Decision**: Fastify
**Rationale**: Fastest Node.js HTTP framework with built-in JSON schema validation, plugin architecture for service composition, and first-class TypeScript support. Express is slower and less structured. Hono is newer with less ecosystem. Fastify's schema-based validation enforces contracts at the API boundary — aligns with the genesis corpus's contract-first doctrine.
**Alternatives Considered**: Express (no schema validation), Hono (smaller ecosystem), NestJS (too opinionated for monorepo services)

## AI Generation

**Decision**: Anthropic Claude API (claude-sonnet-4-5-20250514 for generation, claude-haiku-4-5-20251001 for scoring/classification)
**Rationale**: Claude excels at long-context content generation with nuanced brand voice adherence. Sonnet for caption generation and content creation (quality-critical). Haiku for bulk scoring, classification, and Natural Center derivation steps (cost-critical). The genesis corpus's brand embedding approach maps directly to Claude's system prompt + few-shot pattern: encode the Natural Center as a structured system prompt, provide reference outputs as few-shot examples, generate with consistency constraints.
**Alternatives Considered**: OpenAI GPT-4o (less nuanced for brand voice), Gemini (less structured output), open-source models (insufficient quality for premium brand content)

## Media Processing

**Decision**: FFmpeg (via fluent-ffmpeg) + Sharp (images)
**Rationale**: FFmpeg is the canonical tool for video processing — scene detection, clip extraction, thumbnail generation, format transcoding. Sharp is the fastest Node.js image processor for resizing, cropping, and format conversion. Together they cover the full multimodal extraction pipeline from the genesis corpus (ALG_01 through ALG_03). Both are mature, well-documented, and run locally without API dependencies.
**Alternatives Considered**: cloud-based transcoding (unnecessary latency + cost for MVP), Jimp (slower than Sharp), ImageMagick (heavier than needed)

## Audio Transcription

**Decision**: OpenAI Whisper API
**Rationale**: Text hooks from audio transcription are part of fragment extraction (FR-002). Whisper is the most accurate general-purpose transcription model. API version avoids local GPU requirements. Cost is minimal ($0.006/minute). Complements Claude for the generation step.
**Alternatives Considered**: Deepgram (higher cost), AssemblyAI (comparable but smaller ecosystem), local Whisper (requires GPU, complicates deployment)

## Database

**Decision**: PostgreSQL 16 with pgvector extension
**Rationale**: The data model requires relational integrity (asset → fragment → content unit → publish event lineage) plus vector storage for brand embeddings. PostgreSQL handles both. pgvector enables cosine similarity scoring for Natural Center alignment checks without a separate vector database. JSONB columns for flexible metadata (platform-specific configs, extraction parameters). Row-level security for multi-tenant isolation (Layer 3).
**Alternatives Considered**: MySQL (no vector support), MongoDB (lineage integrity harder to enforce), separate vector DB like Pinecone (unnecessary complexity when pgvector suffices)

## Queue / Background Jobs

**Decision**: BullMQ (Redis-backed)
**Rationale**: Media processing, content generation, and platform publishing are all async operations. BullMQ provides reliable job queues with retry, priority, rate limiting, and progress tracking — all requirements from the spec (FR-009, exponential backoff). Redis also serves as the cache layer for platform API tokens and rate limit state.
**Alternatives Considered**: RabbitMQ (heavier, separate service), pg-boss (PostgreSQL-based, less battle-tested for media workloads), SQS (cloud-locked)

## Orchestration

**Decision**: Temporal (TypeScript SDK)
**Rationale**: The genesis corpus defines 5 workflow families (asset processing, content generation, publishing, analytics collection, experiment execution). Temporal provides durable workflows that survive crashes, retries, and long-running operations — critical for a pipeline that processes video → generates content → publishes → collects analytics over days. The TypeScript SDK is first-class. Temporal workflows make the system stateful rather than a loose collection of queues.
**Alternatives Considered**: Inngest (simpler but less durable), custom state machine on BullMQ (reinventing Temporal poorly), Step Functions (AWS-locked)

## Frontend

**Decision**: React 19 + Vite + Tailwind CSS v4
**Rationale**: Dashboard for content calendar, brand identity management, and performance reporting. React is the ecosystem standard, Vite is the fastest bundler, Tailwind provides the utility-first CSS the ORGAN-III projects standardize on. Not needed for Layer 1 (CLI-first), but the directory structure is established from day one.
**Alternatives Considered**: Next.js (SSR unnecessary for dashboard), Svelte (smaller ecosystem), Vue (team unfamiliar)

## Platform API Integration Pattern

**Decision**: Adapter pattern with per-platform plugins
**Rationale**: Each social platform (Instagram, LinkedIn, TikTok, YouTube, X) has a different API, authentication flow, rate limit behavior, and content format specification. The genesis corpus defines platform adapters as isolated services with a common interface. Each adapter implements: `authenticate()`, `formatContent()`, `publish()`, `fetchMetrics()`, `getFormatSpec()`. New platforms are added by implementing the interface — no core system changes.
**Alternatives Considered**: Unified social API services like Buffer API (dependency on third party, less control), platform SDKs directly in core (coupling)

## Deployment

**Decision**: Docker Compose (local/dev) → Railway or Render (production)
**Rationale**: Layer 1 runs locally or on a single server. Docker Compose bundles PostgreSQL, Redis, Temporal, and the API. Railway/Render for production because ORGAN-III already deploys there (public-record-data-scrapper on Render, the-actual-news on Cloudflare). No Kubernetes until multi-tenant scale demands it.
**Alternatives Considered**: Vercel (not suited for long-running processes), AWS ECS (over-complex for current scale), bare VPS (less reproducible)
