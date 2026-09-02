# Changelog

## 0.1.1

- README: heading renamed to the published package name (`@alexeyco/pi-statusline`),
  minimum pi version corrected to ≥ 0.76 (peer dependencies are `*`).

- Initial release: compact statusline — `model • thinking` label on the
  editor top border, single-line footer with cwd/branch/session on the left
  and token totals + context usage right-aligned.
- Extracted from `~/.pi/agent/extensions/status-layout` into a standalone
  pi package (`pi.extensions` manifest).
- Unit tests for the pure layout helpers, CI sanity checks, tag-driven
  npm publish workflow, gallery preview (`docs/gallery/`, wired via `pi.image`).
