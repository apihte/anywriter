# AnyWriter Shared Rules

## Purpose

AnyWriter distills user-provided fiction into traceable knowledge and uses approved knowledge to plan, draft, review, and revise new fiction. The six public skills are `aw-distill`, `aw-task`, `aw-write`, `aw-review`, `aw-byimage`, and `aw-caption`; their command names are identical.

## Project Directory Contract

- `files/source/` contains immutable source text.
- `files/reference/<slug>/` contains immutable user-uploaded images, the approved visual reference sheet, its `status.json`, and optional non-canon reference drafts.
- `files/knowledge/versions/vN/` contains immutable candidate and approved knowledge versions; `files/knowledge/status.json` resolves the current candidate and approved version.
- `files/work/<task-id>/` contains one creative task with all of its versions and its `status.json`.

## Non-Negotiable Rules

1. Never edit, rename, move, or delete anything under `files/source/`.
2. Cite source claims as `[relative-file:Lstart-Lend]`. Do not invent citations.
3. Keep source facts, interpretations, uncertainties, and creative additions visibly separate.
4. Treat approved artifacts as immutable. Create a new versioned path instead of overwriting approved content.
5. Stop at every approval gate and record the decision in the matching status file before continuing.
6. Never promote draft-only facts into `files/knowledge/` outside the approved promotion branch.
7. Build task context from status files, approved artifacts, and cited evidence, never from chat history alone.
8. Prefer abstract style traits over copied wording, and flag conspicuous phrase reuse during review.
9. Store prose, introduced-facts lists, and revision change logs in separate files. `final/` contains prose only.
10. Delegate analysis only to the `aw-analyst` role and independent review only to the `aw-reviewer` role.
11. Never edit, rename, move, or delete original image files under `files/reference/`; reference drafts stay non-canon until a task finalizes them.
12. Cite image claims as `[reference:<slug>/<file>#<region>]`; never describe unseen details or copy on-image text and watermarks into prose.
13. Caption runs treat image folders as read-only: add same-name `.txt` caption files only, skip existing files unless the user passes `-r` to overwrite.

## Approval Gates

1. Image reference sheet, before any image-referenced generation.
2. Distilled knowledge.
3. Creative brief and impact analysis.
4. Outline.
5. Draft review findings and requested revisions.
6. Finalization.

## Generation Modes

- `abstract-style`: transfer narrative traits while using original expression.
- `high-fidelity`: apply a denser set of approved style traits while checking phrase reuse.
- `fan-continuation`: prioritize character, world, timeline, and plot continuity.

The generation unit (scene, chapter, multi-chapter, or custom range) is chosen per write invocation and may change during a task.

## Evidence Rule

- Source evidence: `[relative-file:Lstart-Lend]`.
- Image evidence: `[reference:<slug>/<file>#<region>]`.
- Approved derived knowledge and final prose: `[artifact-path#heading]`.
