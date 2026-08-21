# CLI Adapters

Each supported CLI or agent harness has its own adapter directory. Adapters may register commands, agents, hooks, manifests, or platform-specific instructions, but they must reuse the root-level `locales/` and `shared/` resources.

## Current Adapters

- `opencode/`: OpenCode plugin entry and runtime registration.

## Planned Adapters

- `claude-code/`: Claude Code plugin manifest, agents, commands, and hooks.
- `codex/`: Codex plugin manifest, `AGENTS.md` integration, and skills.

An adapter must not create a second novel data model. All platforms use the project-level `.aw/config.json` and `files/` directory contract.
