# Testing Extensions & Skills

## Setup

```bash
npm install
```

## Run Tests

```bash
npm test
```

Or a single run:

```bash
npm run test:run
```

## Project Layout

- Source lives in `extensions/` and `skills/` for IDE visibility.
- Pi loads them via symlinks in `.pi/`:
  - `.pi/extensions` → `extensions/`
  - `.pi/skills` → `skills/`

## Writing Tests

- Add tests under `test/`.
- Use `test/extension-harness.ts` to register extensions and simulate session events.
- For skills, add tests that run your scripts directly (e.g., `node` or `bash`) and assert on stdout.

## Example

- `test/variable-store.test.ts` demonstrates storing variables with descriptions and state reconstruction.
