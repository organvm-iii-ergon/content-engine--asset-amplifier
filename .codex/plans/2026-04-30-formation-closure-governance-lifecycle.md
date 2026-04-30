# Formation And Closure Governance Lifecycle Plan

Date: 2026-04-30

## Purpose

Implement the two-corpus sequencing plan by updating the reusable prompt-bundle
process so it can recognize both project-formation prompts and
session-closeout/governance prompts without collapsing them into one flat
sequence.

## Intended Changes

1. Update `docs/genesis-project/repeatable-pasteboard-meta-process-prompt.md`.
   - Add macro-entity separation before micro sequencing.
   - Add closure/persistence/registry governance to the taxonomy.
   - Add traceability spine as the missing connective layer.
   - Add the reusable closeout-governance prompt.
   - Preserve the distant critic framing.

2. Add `docs/genesis-project/two-corpus-formation-closure-governance-report.md`.
   - Define the two macro entities.
   - Provide macro and micro sequences.
   - State what repeats, what stays where, and what is missing.
   - Include reusable prompt templates for meta-intake, formation,
     traceability, and closure governance.

## Verification

- Search for required concepts:
  - `hall-monitor`
  - `safe-to-close`
  - `N/A`
  - `vacuum`
  - `local:remote`
  - `traceability spine`
  - `IRF`
  - `Sisyphus`
- Run `git diff --check`.
- Confirm only the intended documentation and plan files changed.

## Closeout

Commit the documentation update and push it to a live remote ref so the local
artifact and remote history match.
