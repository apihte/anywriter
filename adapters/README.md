# CLI Adapters

Each supported CLI or agent harness has its own adapter directory. Adapters may register commands, agents, hooks, manifests, or platform-specific instructions, but they must reuse the root-level `locales/` and `shared/` resources.

## Current Adapters

- `opencode/`: OpenCode 1 plugin entry and runtime registration.
- `opencode2/`: OpenCode 2 `Plugin.define` server plugin using the V2 transform APIs.
- `pi/`: Pi package extension, slash commands, skills, prompt injection, and `aw_save_images` tool.

## Planned Adapters

- `claude-code/`: Claude Code plugin manifest, agents, commands, and hooks.
- `codex/`: Codex plugin manifest, `AGENTS.md` integration, and skills.

The OpenCode 2 and Pi adapters share `adapters/shared/runtime.ts`; locale skills and the `.aw/config.json` / `files/` contract remain the single source of truth. An adapter must not create a second novel data model.
