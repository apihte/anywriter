# AnyWriter Lifecycle

## States

```text
not_distilled
  -> knowledge_pending_approval
  -> knowledge_approved
  -> brief_pending_approval
  -> outline_pending_approval
  -> ready_to_write
  -> drafting
  -> review_pending_approval
  -> revising
  -> ready_to_finalize
  -> finalized
```

## Transitions

| From | Action | Required output | To |
|---|---|---|---|
| `not_distilled` | Distill source | Knowledge artifacts and coverage report | `knowledge_pending_approval` |
| `knowledge_pending_approval` | User approves knowledge | Approval record | `knowledge_approved` |
| `knowledge_approved` | Create task | Brief and impact analysis | `brief_pending_approval` |
| `brief_pending_approval` | User approves brief | Outline | `outline_pending_approval` |
| `outline_pending_approval` | User approves outline | Approval record | `ready_to_write` |
| `ready_to_write` or `drafting` | Write selected unit | Versioned draft and introduced-facts list | `drafting` |
| `drafting` | Request review | Review report | `review_pending_approval` |
| `review_pending_approval` | User selects findings | Revision decision | `revising` |
| `review_pending_approval` | No findings or user accepts draft as-is | Approval decision | `ready_to_finalize` |
| `revising` | Apply revisions | Revised draft and change log | `ready_to_finalize` |
| `ready_to_finalize` | User approves final | Final artifact and approval record | `finalized` |
| `ready_to_finalize` | Continue with another unit | Versioned draft and introduced-facts list | `drafting` |
| `ready_to_finalize` | Request another review cycle | Review report | `review_pending_approval` |

## Invalidation

- A source fingerprint mismatch sets knowledge state to `stale`; re-run distillation to produce a new candidate for approval.
- Rejecting knowledge returns to `not_distilled` or keeps the task at `knowledge_pending_approval` with requested changes.
- Changing an approved brief invalidates its outline and downstream drafts.
- Changing an approved outline invalidates drafts for affected units.
- Changing approved knowledge marks every non-finalized dependent task as `stale` until `/aw-task refresh <task-id>` reviews the impact and the user approves any required brief or outline changes.
- Refreshing a stale task records the new knowledge version, creates a new impact-analysis version, creates new brief or outline versions when required, and clears `stale` only after approval.

## Resume Rule

The Director must derive the next action from status files and approved artifacts, not from conversation memory.
