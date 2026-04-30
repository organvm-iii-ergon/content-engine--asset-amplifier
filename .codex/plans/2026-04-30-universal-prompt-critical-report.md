# Universal Prompt Critical Report Implementation Plan

## Goal

Create a theoretical-critical report from the brainstorm conversation corpus in
`docs/genesis-project/conversations/`. The report should explain the use and
value of recurring project-start prompts, the outputs expected from them, and a
generalized sequence other people can study, critique, and reuse.

## Source Boundary

- Primary corpus: `docs/genesis-project/conversations/*.md`
- Supporting metadata: `docs/genesis-project/metadata/project.json`
- Do not edit the source conversations or extracted source files.

## Deliverable

Create `docs/genesis-project/prompt-method-critical-report.md`.

The report must include:

- A corpus overview.
- A taxonomy of recurring prompt functions.
- Expected output and value for each prompt type.
- A universal project-brainstorm sequence.
- A theoretical critique of strengths and failure modes.
- A replicable protocol for future projects.
- An evidence map from source conversation files to prompt functions.

## Implementation Notes

- Treat the content-engine corpus as provenance evidence, not as the authority
  for the universal method.
- Preserve the difference between raw prompt language, source metadata, and
  generalized form.
- Keep the report readable for external reviewers who do not know the product.
- Avoid turning the report into an implementation blueprint.

## Verification

- Confirm every conversation file maps to at least one prompt function.
- Confirm the report contains both the sequence and the critique.
- Run markdown/text checks where available.
