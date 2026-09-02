# Changelog

## 0.1.0

- Initial release: compact statusline — `model • thinking` label on the
  editor top border, single-line footer with cwd/branch/session on the left
  and token totals + context usage right-aligned.
- Extracted from `~/.pi/agent/extensions/status-layout` into a standalone
  pi package (`pi.extensions` manifest).
- Unit tests for the pure layout helpers, CI sanity checks, tag-driven
  npm publish workflow, gallery preview (`docs/gallery/`, wired via `pi.image`).
