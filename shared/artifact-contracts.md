# AnyWriter Artifact Contracts

## Knowledge Artifacts

`files/knowledge/` contains:

- `source-index.md`: current immutable-source inventory, fingerprints, logical sections, and coverage.
- `status.json`: candidate path, approved path, source fingerprints, coverage, and approval records. Must conform to `knowledge-status.schema.json` bundled with the plugin.
- `chapters/`: optional section-level analysis for larger works.
- `versions/vN/`: immutable knowledge candidates. Each version contains `story-bible.md`, `characters.md`, `world.md`, `timeline.md`, `plot.md`, `style-profile.md`, `open-questions.md`, and a snapshot of relevant source coverage.

The template router is `shared/templates/distillation-router.md`. It selects the detailed extraction templates `distillation-character.md`, `distillation-world.md`, `distillation-plot.md`, and `distillation-style.md`. Unmatched requests use the router's design pass and `distillation-custom.md`; a field may be marked `not mentioned` when the source provides no evidence.

Agents must resolve knowledge through `status.json`. They must not invent or rely on an unversioned knowledge alias.

## Task Artifacts

Each `files/work/<task-id>/` contains:

- `status.json`: lifecycle state, exact active artifact paths, and dependency versions. Must conform to `task-status.schema.json` bundled with the plugin.
- `brief-vN.md`: normalized creative request.
- `impact-analysis-vN.md`: affected canon, plot, characters, and risks.
- `outline-vN.md`: approved hierarchy of units.
- `drafts/<unit>-vN.md`: versioned prose only.
- `drafts/<unit>-vN-facts.md`: draft-only introduced facts.
- `drafts/<unit>-vN-changes.md`: revision change log when applicable.
- `reviews/<unit>-vN-review.md`: independent findings.
- `decisions.md`: user approvals and selected findings.
- `final/`: approved final output, prose only.

## Version Rule

Approval freezes a version. Subsequent changes create `v2`, `v3`, and so on. Status files point to the active version; old versions remain available.

## Evidence Rule

- Source evidence: `[relative-file:Lstart-Lend]`.
- Approved derived knowledge: `[artifact-path#heading]`.
- Approved final prose additions: `[artifact-path#heading]`.
