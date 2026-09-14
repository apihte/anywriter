---
name: aw-caption
description: Generates image captions in batch when the user names a folder of images and asks to reverse-describe, caption, or annotate the images.
---

# AW Image Captioning

Caption every image in the given folder and write each caption to a same-name `.txt` beside the image.

## Shared References

Paths are relative to this skill's directory:

- Rules: `../../../../shared/rules.md`
- Artifact contracts: `../../../../shared/artifact-contracts.md`

## Inputs

- Image folder path (project-relative or absolute).
- `caption_prompt` from `.aw/config.json`, appended as the system prompt for this task.
- Optional: `-r` (overwrite existing `.txt` files; without it they are skipped), language, format, fields, recursive subfolders, or file filters.

## Steps

1. Read `.aw/config.json` and apply `caption_prompt` as the appended system prompt. It takes precedence over `writer_prompt` and merges with the user's additional requirement. Fall back to the default caption rules when the config is missing.
2. Resolve the folder; ask the user when the path is missing. Process images directly inside it by default and recurse only when the user asks. Supported extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.avif`.
3. Process images in filename order:
   - Read each image with the Read tool.
   - When `caption_prompt` is empty, use the default rule: one concise natural-language description covering subject, scene, composition, lighting, color, mood, and style.
   - When `caption_prompt` defines a format or fields, follow it exactly.
   - Describe only visible content and never invent unseen details. Do not put watermarks, trademarks, or on-image text into captions unless `caption_prompt` explicitly requires it.
4. Write each caption to a same-name `.txt` beside the image (UTF-8, in the format `caption_prompt` defines; single-line text when unspecified).
5. When `-r` appears in the arguments, overwrite existing `.txt` files; otherwise skip existing `.txt` files and count them as skipped. Strip `-r` from the requirement text instead of treating it as a caption instruction.
6. Report the number of successes, skipped files, failure reasons, and sample captions; ask whether to adjust `caption_prompt` and rerun.

## Boundaries

- Images are read-only: never modify, rename, move, or delete an image.
- For images containing nudity, sexual, violent, or otherwise sensitive content, produce neutral non-explicit captions only; sexualized content involving minors is refused.
- Do not copy watermarks, trademarks, or protected expression from images.

## Completion Criteria

- Every processed image has a matching `.txt`, or an explicit skip reason is reported (existing file without `-r`).
- Captions follow `caption_prompt` or the default rules and describe only visible content.
- Existing files are overwritten only when `-r` is passed.
