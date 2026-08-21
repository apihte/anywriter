---
name: aw-review
description: Reviews, revises, or finalizes AnyWriter novel drafts when the user asks to check continuity, requirements, characterization, timeline, world rules, style, originality, prose quality, apply selected review findings, or approve a final version.
---

# AW Review

Run independent review before controlled revision and finalization.

## Shared References

Paths are relative to this skill's directory:

- Rules: `../../../../shared/rules.md`
- Lifecycle: `../../../../shared/lifecycle.md`
- Artifact contracts: `../../../../shared/artifact-contracts.md`
- Templates: `../../../../shared/templates/`

## Review Branch

1. Read the shared rules, the active task artifacts, and the relevant approved knowledge.
2. Confirm the exact immutable draft version under review.
3. Delegate review to the AW Reviewer. The writer must not review its own output in place of this step.
4. Require findings to include severity, location, dimension, explanation, evidence, and minimal correction.
5. Save the report under `reviews/` and update status to `review_pending_approval`.
6. Present findings ordered by severity. Stop while the user accepts, rejects, or modifies findings.
7. If there are no findings, or the user accepts the draft without revision, record that decision and update status directly to `ready_to_finalize`.

## Revision Branch

1. Record the user's selected findings in `decisions.md`.
2. Update status to `revising`.
3. Create a new draft version, applying only selected findings and necessary consistency repairs.
4. Save a separate `drafts/<unit>-vN-changes.md` mapping each selected finding to its resolution.
5. Recheck modified passages for new blocking contradictions.
6. Update status to `ready_to_finalize` and ask for final approval or another review cycle.

## Finalization Branch

1. Require status `ready_to_finalize`, reached either through the no-findings path or a completed revision.
2. Ask for explicit user approval of the active draft as final.
3. On approval, copy prose only to `final/`, record the decision with the final artifact path, and set status to `finalized`.

## Completion Criteria

- Review is independent and tied to a specific draft version.
- Every selected finding is resolved or explicitly declined with a reason.
- Finalization occurs only after user approval.
  - Draft-only facts enter approved knowledge only through the approved promotion branch of `aw-distill`.
