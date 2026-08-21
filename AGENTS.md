# AnyWriter Plugin Repository

This repository contains the publishable AnyWriter plugin. Platform adapters live under `adapters/`; localized Agent and Skill resources live under `locales/`; shared rules, schemas, and templates live under `shared/`.

## Rules

- Keep the package usable from a clean checkout.
- Keep both `locales/en/` and `locales/zh/` synchronized in public Skill names: `aw-distill`, `aw-task`, `aw-write`, and `aw-review`.
- Do not add novels, generated knowledge, `.aw/` project configuration, credentials, or model-specific secrets to this repository.
- Preserve `files/source/**` as the runtime data path documented by the plugin.
- Validate `package.json`, all JSON schemas, and both locale resource sets before publishing.

## Local Verification

```bash
npm pack --dry-run
```

Use a separate temporary project to test `/aw-init`, `/aw-config`, and `/aw-status`.
