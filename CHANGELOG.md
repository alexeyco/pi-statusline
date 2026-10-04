# Changelog

## 0.2.0

- Footer redesigned after the layout I actually run: the editor border label
  and the cwd/branch/session and token-total stats are gone. The footer is a
  single line — `model • thinking • ctx%/window` on the left, `MCP: n` on the
  right; extension statuses keep their own dim line below.
- The MCP count is read from `~/.pi/agent/mcp.json` and refreshes on
  `mcp_servers_change` and `session_start`.
- Context display survives an unknown context window (`?` or `42.1%` instead
  of `42.1%/0`); on narrow terminals the left side truncates first, the right
  side is hard-clipped only when it cannot fit alone.
- Gallery mockup: stale extension-status line removed, editor and footer
  pinned to the window bottom; PNG re-rendered.
- CHANGELOG regained the missing `0.1.0` heading; dev dependencies bumped to
  pi 1.0.x.

## 0.1.1

- README: heading renamed to the published package name (`@alexeyco/pi-statusline`),
  minimum pi version corrected to ≥ 0.76 (peer dependencies are `*`).

## 0.1.0

- Initial release: compact statusline — `model • thinking` label on the
  editor top border, single-line footer with cwd/branch/session on the left
  and token totals + context usage right-aligned.
- Extracted from `~/.pi/agent/extensions/status-layout` into a standalone
  pi package (`pi.extensions` manifest).
- Unit tests for the pure layout helpers, CI sanity checks, tag-driven
  npm publish workflow, gallery preview (`docs/gallery/`, wired via `pi.image`).
