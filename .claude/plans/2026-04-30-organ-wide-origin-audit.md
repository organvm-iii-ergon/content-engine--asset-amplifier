# 2026-04-30 — Organ-Wide Split-Origin Audit (PLAN STUB, NO EXECUTION)

> **Status:** plan stub only. Captured while context is fresh during the
> origin-unity follow-up session for `content-engine--asset-amplifier`. Do
> not execute without explicit user direction — this is a 119-repo
> coordination problem with policy questions that precede tooling.

---

## Context

During the freshening of the origin-unity plan for
`content-engine--asset-amplifier` on 2026-04-30, sampling 5 sibling repos in
`~/Workspace/organvm/` revealed a systemic pattern:

| Repo | Declared canonical (`seed.yaml.org`) | Actual `git remote origin` |
| --- | --- | --- |
| `content-engine--asset-amplifier` | `organvm-iii-ergon` | `organvm-iii-ergon` ← fixed this session |
| `agentkit` | (TBD — not read) | `a-organvm` |
| `analytics-engine` | `organvm-v-logos` | `a-organvm` |
| `commerce--meta` | (TBD — not read) | `a-organvm` |
| `community-hub` | (TBD — not read) | `a-organvm` |
| `agentic-titan` | (TBD — not read) | `a-organvm` |

5/5 sampled siblings have origins on the staging org `a-organvm`, despite
their `seed.yaml` declaring canonical homes. With ~118 organvm/* repos,
this is likely an organ-wide drift, not a per-repo accident.

`content-engine--asset-amplifier` is now the first repo with origin
pointing at canonical. The remaining ~118 are in the dual-origin state.

---

## What this audit needs to produce

### 1. Full inventory

For every repo under `~/Workspace/organvm/` (and equivalent for organ-I
through organ-VII directories per the workspace CLAUDE.md map):

```
{
  repo: "agentkit",
  declared_org: "<from seed.yaml.org>",
  declared_org_exists_on_github: true|false,
  actual_origin: "a-organvm/agentkit",
  canonical_repo_exists_on_github: true|false,
  canonical_repo_default_branch: "main"|"feature/...",
  promotion_status: "LOCAL"|"CANDIDATE"|...,
  divergence: "none"|"staging-only"|"split"|"orphaned"
}
```

Script shape:
```bash
for r in ~/Workspace/organvm/*/; do
  pushd "$r" >/dev/null
  declared=$(yq '.org' seed.yaml 2>/dev/null)
  actual=$(git remote get-url origin 2>/dev/null)
  status=$(yq '.metadata.promotion_status' seed.yaml 2>/dev/null)
  echo "$(basename $r) declared=$declared actual=$actual status=$status"
  popd >/dev/null
done
```

### 2. Cross-reference with GitHub

For each declared org found in the inventory:
```bash
gh repo list organvm-i-genesis --limit 100 --json name,visibility
gh repo list organvm-ii-poiesis --limit 100 --json name,visibility
gh repo list organvm-iii-ergon --limit 100 --json name,visibility
gh repo list organvm-iv-taxis --limit 100 --json name,visibility
gh repo list organvm-v-logos --limit 100 --json name,visibility
gh repo list organvm-vi-koinonia --limit 100 --json name,visibility
gh repo list organvm-vii-kerygma --limit 100 --json name,visibility
gh repo list a-organvm --limit 200 --json name,visibility
gh repo list meta-organvm --limit 100 --json name,visibility
```

Goal: which canonical repos exist? Are any private? Which have public
content already? Which would be problematic to publicize?

### 3. Decision matrix per repo

For each repo, choose one of:
- **Promote** — origin → declared canonical, push public, bump
  `promotion_status`. Requires that the canonical org/repo exists and
  the content is appropriate for public.
- **Re-declare** — declared org in `seed.yaml` is wrong/aspirational;
  rewrite `seed.yaml.org` to match `a-organvm`.
- **Archive** — repo is dead; mark it ARCHIVED.
- **Hold** — content needs review (secrets, partner code, NDA-bound work)
  before publication decision.

### 4. Promotion protocol design

Per repo, the mechanical steps that follow `content-engine--asset-amplifier`'s
pattern:
```bash
# Verify push permission on canonical
gh api repos/<canonical-org>/<repo> --jq '.permissions'

# Reconfigure remotes (local-only, reversible)
git remote rename origin staging
git remote add origin git@github.com:<canonical-org>/<repo>.git
git fetch origin

# Re-attach main, fast-forward push
git branch --set-upstream-to=origin/main main
git push origin main   # gated — needs PR if classifier blocks

# Reconcile seed.yaml + README + .gitignore in same commit
# (model after content-engine--asset-amplifier PR #21)
```

---

## Risks

- **Secret leak.** Any repo with hardcoded secrets, partner credentials,
  or NDA content cannot be promoted to a public canonical org. Pre-flight
  with `gitleaks` per repo before any push.
- **Org-permissions mismatch.** The user may not have `admin:write` on
  every declared canonical org. Per-repo `gh api repos/.../permissions`
  check is mandatory.
- **History exposure.** Even if current `main` is clean, deep git history
  may contain things you don't want public. `git log --all -p | gitleaks
  detect --pipe` per repo before promotion.
- **Cross-repo dependency drift.** If repo A was importing from
  `a-organvm/B` and B promotes to `organvm-iii-ergon/B`, A's lockfiles
  may break. Inventory must capture cross-repo edges before batch
  execution.
- **Workspace CLAUDE.md drift.** The workspace CLAUDE.md says
  `organvm-iii-ergon/` directory maps to GitHub org `labores-profani-crux`,
  but this repo's actual origin is `organvm-iii-ergon`. The CLAUDE.md
  table may be outdated. Audit must reconcile the table with on-disk
  reality before any batch action.

---

## What this stub is not

- Not a sequenced execution plan. The decision matrix is the gate.
- Not a script. Code shapes above are illustrative; production audit
  needs a real Python/Bash module under `meta-organvm/scripts/`.
- Not a prediction of how many repos should be public. That's a policy
  question for the user.

---

## Status: STUB. Do not execute. Read first when ready to scope the campaign.
