---
name: aw-task
description: Plans AnyWriter novel changes when the user asks to modify, expand, continue, rewrite, branch, or retell characters, setting, plot, scenes, narration, or style, or to refresh a stale novel task.
---

# AW Transformation

Turn a creative request into approved constraints and an executable outline.

## Shared References

Paths are relative to this skill's directory:

- Rules: `../../../../shared/rules.md`
- Lifecycle: `../../../../shared/lifecycle.md`
- Artifact contracts: `../../../../shared/artifact-contracts.md`
- Task status schema: `../../../../shared/task-status.schema.json`
- Templates: `../../../../shared/templates/`

## Inputs

- User request.
- Approved knowledge version resolved through `files/knowledge/status.json`.
- Optional source anchor, style mode, and generation preference.

## Planning Steps

1. Read the shared rules, lifecycle, and artifact contracts.
2. Confirm knowledge state is `knowledge_approved`. If not, stop at that gate.
3. Create a task ID and directory under `files/work/` without overwriting an existing task.
4. Normalize the request into `brief-v1.md`: operation, source anchor, required changes, preserved elements, forbidden changes, style mode, viewpoint, tense, desired outcome, and current generation preference.
5. Ask one focused question for each unresolved decision that would materially alter the plan. Record answers in `decisions.md`.
6. Build `impact-analysis-v1.md` from the exact approved knowledge path and relevant source evidence. Cover characters, world rules, timeline, causal chain, foreshadowing, and downstream risks.
7. Update task status to `brief_pending_approval` and stop for approval of the brief and impact analysis.
8. After recording separate approvals for the brief and impact analysis, create `outline-v1.md` with units, goals, required events, prohibited events, starting state, ending state, and continuity dependencies.
9. Update task status to `outline_pending_approval` and stop for outline approval.
10. After approval, record the decision and update status to `ready_to_write`.

## Stale Task Refresh Branch

1. Run for a task with `stale: true`, typically via `/aw-task refresh <task-id>`.
2. Compare the task's recorded knowledge version with the current approved knowledge path.
3. Create the next `impact-analysis-vN.md`. Create new brief or outline versions only when the changed knowledge affects them.
4. Stop for approval of every changed artifact.
5. After approval, update active artifact paths and `knowledge_version`, clear `stale`, and restore the task's valid lifecycle state.

## Completion Criteria

- The task has a unique directory and a status file valid against the shared task schema.
- The brief distinguishes required, preserved, and forbidden content.
- The impact analysis cites the exact approved knowledge path or source evidence.
- An approved outline exists before status becomes `ready_to_write`.
