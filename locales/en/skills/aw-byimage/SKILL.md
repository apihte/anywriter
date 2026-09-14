---
name: aw-byimage
description: Generates AnyWriter content from user-uploaded images when the user asks to reverse-describe an image, extract characters, scene, composition, lighting, color, mood, or style traits for writing, or attach image references to a creative task.
---

# AW Image-Referenced Generation

Treat user-uploaded images as immutable references: build a region-cited visual reference sheet, get user approval, then generate content from it.

## Shared References

Paths are relative to this skill's directory:

- Rules: `../../../../shared/rules.md`
- Lifecycle: `../../../../shared/lifecycle.md`
- Artifact contracts: `../../../../shared/artifact-contracts.md`
- Reference status schema: `../../../../shared/image-reference-status.schema.json`
- Reference template: `../../../../shared/templates/image-reference.md`

## Inputs

- Uploaded images. Use the `aw_save_images` tool to save the session uploads into `files/reference/<slug>/` and adopt the returned paths, bytes, and SHA-256; only when the tool is unavailable, ask the user for local image paths. Never reconstruct a file from a chat attachment.
- Generation requirement: output type (prose | character or scene design | brief material), target scope, generation mode, and granularity.
- Optional: an existing task ID to attach to, and the approved knowledge version.

## Branch A: Image Reference Extraction

1. Read the shared rules, lifecycle, and artifact contracts.
2. Create a unique `files/reference/<slug>/`; if it exists, choose a new slug instead of overwriting.
3. Call `aw_save_images` with the target slug to save the uploads there, and write the returned paths, bytes, and SHA-256 into `status.json` `images`; when no image can be saved, ask the user to upload again or provide local paths.
4. Analyze each image with `shared/templates/image-reference.md`, recording only observable facts:
   - subject, appearance, pose, clothing
   - setting, environment, props
   - composition, shot size, camera angle, viewpoint
   - lighting, color, tonal range
   - mood and abstract style traits
   - visible text and watermarks
   - uncertain or not visible content
5. Cite every claim as `[reference:<slug>/<file>#<region>]`, using regions such as `center`, `top-left`, `background`, `foreground`. Never invent unseen details.
6. Save the sheet as `files/reference/<slug>/image-ref-v1.md`.
7. Set `status.json` to `pending_approval`, present the sheet, uncertainties, and intended scope, and stop for user approval.
8. On approval, append the approval record and set state to `approved`. On requested changes, create `image-ref-v2.md` and repeat the gate.

## Branch B: Image-Referenced Generation

1. Confirm the reference sheet is approved and the image fingerprints are unchanged; otherwise stop.
2. Resolve the output target:
   - Existing task: record the reference sheet as brief material and include it in the aw-write context pack as scene or style reference; write prose to that task's `drafts/` and obey its status gates.
   - Standalone: write a versioned draft under `files/reference/<slug>/drafts/` and mark it explicitly non-canon. To enter the creative workflow, direct the user to `/aw-task`.
3. Generate only from approved visible traits; transfer style abstractly and do not copy on-image text, watermarks, or protected expression.
4. Save newly introduced setting facts to a separate `drafts/<name>-vN-facts.md`; keep them draft-only.
5. Update `status.json` with the active reference version, draft paths, `linked_task`, and next actions.
6. Present a coverage checklist (image trait to text target) and ask whether to continue, revise, or attach to a task.

## Boundaries

- Images are creative references only; never fabricate statements by identifiable real people, impersonate, or defame.
- For images containing nudity, sexual, violent, or otherwise sensitive content, produce neutral non-explicit description only and never generate explicit content; sexualized content involving minors is refused.
- Do not copy watermarks, trademarks, or protected expression from images.
- Mark uncertain or invisible details as such; never fill gaps with invention.

## Completion Criteria

- Original images are immutable with recorded bytes and SHA-256.
- Every reference claim has a region citation and no content is generated before approval.
- Generated content uses only approved references and approved knowledge; standalone drafts are marked non-canon.
- `status.json` conforms to the shared schema and records the next gate or final artifact.
