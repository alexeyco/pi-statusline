# pi-statusline

Compact statusline extension for the pi coding agent, published as a pi package.
Human-facing docs: [README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md).

## Layout

- `src/index.ts` — the extension; pi loads it via the `pi.extensions` manifest in
  `package.json`. All pi API wiring and styling lives here.
- `src/status.ts` — pure layout/formatting helpers (plain strings, no pi/TUI
  imports) — this is what keeps the layout unit-testable.
- `src/status.test.ts` — node:test unit tests for the helpers (`make test`).
- `package.json` — npm metadata + pi manifest; keep the `pi-package` and
  `pi-extension` keywords (gallery discoverability).

## Conventions

- Docs and comments in English.
- Keep `src/status.ts` free of pi/TUI imports: layout on plain strings, styling
  only in `src/index.ts`.
- Never push `master`; work on feature branches, merge via PR.
- Commit messages: no conventional prefixes, past tense.

## Release

Tag-driven npm publish — see [CONTRIBUTING.md](CONTRIBUTING.md#publishing) and
`.github/workflows/publish.yml`.
