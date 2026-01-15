# Agent Guidelines

## Scope
This repo contains pi agent integrations: extensions, skills, prompts, and tooling.

## Repo Layout
- Source lives in `extensions/` and `skills/` for IDE visibility.
- Pi loads them via symlinks in `.pi/`:
  - `.pi/extensions` → `extensions/`
  - `.pi/skills` → `skills/`

## Code Style
- TypeScript, ESM (`type: "module"`).
- Prefer simple, explicit logic over abstractions.
- Use `StringEnum` for tool action enums.

## Extensions
- Store state in tool result `details` for proper branching.
- Reconstruct state on `session_start`, `session_switch`, `session_fork`, `session_tree`.
- Variable marker is `%` (e.g., `%home_address`), and descriptions are supported.

## Testing
- Use `vitest` for tests.
- Place tests in `test/` with `*.test.ts`.
- Use `test/extension-harness.ts` for extension tests.
- Run tests with `npm test`.

## Docs
- Update `TESTING.md` if test workflow changes.
