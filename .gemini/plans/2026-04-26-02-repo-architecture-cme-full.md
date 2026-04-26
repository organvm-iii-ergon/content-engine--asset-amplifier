# REPO_ARCHITECTURE_CME_FULL

**Date:** 2026-04-26
**Target:** Full-Stack Implementation Blueprint (Multi-Tenant SaaS)

## 1. File Tree & Architecture
```text
/cme-saas-platform (Content-Meta-Engine)
├── .env.example
├── docker-compose.yml
├── /gateway (API Gateway / Load Balancer)
├── /services
│   ├── /vacuum-ledger (Node.js/Prisma - Logs what we don't know)
│   ├── /natural-center-compute (Python/FastAPI - ML algorithms)
│   ├── /clip-extraction (Python/Celery - Video processing/FFmpeg)
│   └── /attribution-engine (Rust - High-speed mathematical modeling)
├── /orchestration
│   ├── /k8s-manifests
│   └── /terraform
└── /frontend
    ├── /storefront (Next.js - Client-facing landing pages)
    └── /dashboard (React - Operator control panel)
```

## 2. Environment Variables (`.env`)
```bash
# Core
SYSTEM_ENV=production
LOG_LEVEL=debug
VACUUM_TOLERANCE_THRESHOLD=0.85 # The point at which we spawn an experiment

# Databases
DATABASE_URL_VACUUM=postgresql://user:pass@db:5432/vacuum
DATABASE_URL_ATOMS=postgresql://user:pass@db:5432/atoms
REDIS_URL=redis://cache:6379/0

# ML & Compute
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
NATURAL_CENTER_VECTOR_DIMENSIONS=1536
```

## 3. Service-by-Service Code Scaffold
- **Vacuum Ledger:** Exposes `/api/v1/vacua` to register unknowns.
- **Natural Center Compute:** Consumes raw text, returns the JSON object defined in the Natural Center spec.
- **Clip Extraction:** Listens on Redis queue for video URLs, downloads, finds high-pathos timestamps based on Natural Center, and trims.
- **Attribution Engine:** Tracks which clip generated which conversion, updating the weights in the Natural Center model.

## 4. First Deployment Scripts
**`scripts/deploy_mvp.sh`**
```bash
#!/usr/bin/env bash
set -e
echo "[CME] Initiating Multi-Tenant SaaS Deployment"
echo "[CME] Applying Terraform state..."
cd orchestration/terraform && terraform apply -auto-approve
echo "[CME] Pushing Kubernetes manifests..."
kubectl apply -f ../k8s-manifests/
echo "[CME] Seeding Vacuum Ledger..."
curl -X POST http://api.cme.internal/vacua -d '{"topic": "initial_user_yearning", "status": "unknown"}'
echo "[CME] Deployment Complete."
```