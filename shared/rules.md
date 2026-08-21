# AnyWriter Shared Rules

## Purpose

AnyWriter distills user-provided fiction into traceable knowledge and uses approved knowledge to plan, draft, review, and revise new fiction. The four public skills are `aw-distill`, `aw-task`, `aw-write`, and `aw-review`; their command names are identical.

## Project Directory Contract

- `files/source/` contains immutable source text.
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

## Approval Gates

1. Distilled knowledge.
2. Creative brief and impact analysis.
3. Outline.
4. Draft review findings and requested revisions.
5. Finalization.

## Generation Modes

- `abstract-style`: transfer narrative traits while using original expression.
- `high-fidelity`: apply a denser set of approved style traits while checking phrase reuse.
- `fan-continuation`: prioritize character, world, timeline, and plot continuity.

The generation unit (scene, chapter, multi-chapter, or custom range) is chosen per write invocation and may change during a task.

## Evidence Rule

- Source evidence: `[relative-file:Lstart-Lend]`.
- Approved derived knowledge and final prose: `[artifact-path#heading]`.
