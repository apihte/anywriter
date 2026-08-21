---
name: aw-write
description: Writes AnyWriter novel prose when the user asks to draft, expand, continue, rewrite, or generate a scene or chapter for an approved novel task.
---

# AW Writing

Generate one explicitly selected unit from approved knowledge and outline versions.

## Shared References

Paths are relative to this skill's directory:

- Rules: `../../../../shared/rules.md`
- Lifecycle: `../../../../shared/lifecycle.md`
- Artifact contracts: `../../../../shared/artifact-contracts.md`
- Task status schema: `../../../../shared/task-status.schema.json`

## Inputs

- Task ID.
- Generation unit: `scene`, `chapter`, `multi-chapter`, or a custom range.
- Optional instructions that refine but do not contradict approved artifacts.

## Steps

1. Read the task status, approved brief, approved outline, and the shared artifact contracts.
2. Confirm task status is `ready_to_write`, `drafting`, or `ready_to_finalize` and not stale. If an upstream artifact is stale or unapproved, stop.
3. Resolve the exact unit. If the request is ambiguous, ask the user to identify the unit or desired range.
4. Build a context pack containing only relevant approved character states, world rules, timeline events, plot dependencies, unresolved threads, style traits, and source anchors.
5. Write the unit according to its outline contract and the selected generation mode.
6. Save a new version under `drafts/`; never overwrite an approved or reviewed draft.
7. Save new character, world, timeline, and plot assertions to a separate `drafts/<unit>-vN-facts.md`. These remain draft-only.
8. Update task status to `drafting`, recording the active draft and dependency versions.
9. Present a concise requirement-coverage checklist and ask whether to continue, revise directly, change generation granularity, or request independent review.

## Completion Criteria

- The requested unit has a versioned draft.
- Every approved hard constraint is satisfied or an explicit conflict is reported.
- New facts are listed in a sidecar file and remain outside approved knowledge.
- Status identifies the active draft and next available actions.
