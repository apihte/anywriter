---
name: aw-distill
description: Distills or updates AnyWriter novel knowledge when the user asks to analyze source fiction, build a story bible, extract or study characters, worldbuilding, plot, timeline, narration, description, or style, or promote approved draft facts into canon.
---

# AW Distillation

Build traceable knowledge from immutable source fiction and approved creative output.

## Shared References

Paths are relative to this skill's directory:

- Rules: `../../../../shared/rules.md`
- Lifecycle: `../../../../shared/lifecycle.md`
- Artifact contracts: `../../../../shared/artifact-contracts.md`
- Knowledge status schema: `../../../../shared/knowledge-status.schema.json`

## Inputs

- Source scope under `files/source/`, or a finalized task whose approved additions should be promoted.
- Requested analysis lens, or `full` for the standard lenses.
- `files/knowledge/status.json`. If missing, scaffold the workspace with `/aw-init` first.

## Template Routing

Read the single routing contract: `../../../../shared/templates/distillation-router.md`.

Normalize the request into target objects, fields, relationships, source scope, and output form, then follow the router to select the smallest template set. Do not maintain a second field mapping in this Skill. If no template clearly matches, perform the router's distillation design pass, write `distillation-plan.md`, and then use `distillation-custom.md`. Do not invent a field contract on the fly.

## Source Distillation Branch

1. Read the shared rules, lifecycle, and artifact contracts.
2. Inventory every source file in scope. Record size, SHA-256, logical sections, and line ranges in `files/knowledge/source-index.md`, and mirror the fingerprints into `status.json` `source_files`.
3. Divide the scope into bounded sections. For a small file, logical headings are enough; for a large work, process chapter files independently.
4. Resolve the template set; if no template matches, complete the distillation design pass first.
5. Delegate each section to the AW Analyst with the selected templates, field contract, and evidence requirements.
6. Require template-shaped output rather than a generic paragraph; check coverage and re-run missing or unsupported sections.
7. Run a second aggregation pass for characters and plot to merge cross-section evidence, state changes, contradictions, and information gaps.
8. Create the next unused `files/knowledge/versions/vN/` directory and synthesize findings there, keeping source facts, interpretations, uncertainty, and conflicts separate.
9. Write unresolved contradictions, missing fields, and decisions to that version's `open-questions.md`.
10. Update `files/knowledge/status.json` to `knowledge_pending_approval`, set `candidate_version` and `candidate_path`, and record covered sources without changing the approved path.
11. Present the candidate knowledge version, template coverage, insufficient-source items, conflicts, and open questions. Stop for user approval.
12. On approval, append an approval record whose `artifact` is the version directory path, set `approved_version`, `approved_path`, and `approved_at`, and change state to `knowledge_approved`.

## Approved Draft Promotion Branch

1. Require a finalized task and its user-approved final prose, introduced-facts file, and exact knowledge dependency.
2. Copy the currently approved knowledge version into the next unused `versions/vN/` candidate.
3. Merge only facts explicitly approved for canon. Cite final artifacts as `[artifact-path#heading]` and preserve their source-derived dependencies.
4. Record changes and conflicts in the candidate `open-questions.md`.
5. Set status to `knowledge_pending_approval` with the new candidate path while retaining the prior approved path.
6. Stop for approval. On approval, update the approved path and mark non-finalized tasks depending on the old version as stale.

## Source Branch Completion

- Every source section in scope is accounted for.
- Every material claim has a valid source citation.
- Required knowledge artifacts exist inside one immutable candidate version or are explicitly marked not applicable.
- The status is `knowledge_pending_approval` and no downstream creative task has started.

## Promotion Branch Completion

- The input task is finalized and the promoted facts were explicitly approved.
- The prior approved knowledge version remains unchanged.
- The new candidate cites final artifacts and records conflicts.
- The status is `knowledge_pending_approval`; dependent active tasks become stale only after the candidate is approved.
