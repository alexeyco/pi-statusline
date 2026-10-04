/**
 * Pure layout helpers for status-layout.
 *
 * No pi/TUI imports here — everything works on plain (unstyled) strings,
 * which keeps this module unit-testable. Styling is applied by the caller
 * after layout; ANSI styling never changes visible width, so widths
 * computed here stay valid after coloring.
 */

/** Drop a trailing ".0" so "1.0k" reads as "1k" (9999 → "10.0k" → "10k"). */
function trimDecimal(s: string): string {
  return s.replace(/\.0/, "");
}

/** Compact token counts: 999 → "999", 1000 → "1k", 1500 → "1.5k",
 * 9999 → "10k", 123456 → "123k". */
export function formatTokens(count: number): string {
  if (count < 1000) return String(count);
  if (count < 10000) return trimDecimal(`${(count / 1000).toFixed(1)}k`);
  if (count < 1000000) return `${Math.round(count / 1000)}k`;
  if (count < 10000000) return trimDecimal(`${(count / 1000000).toFixed(1)}M`);
  return `${Math.round(count / 1000000)}M`;
}

/** "model • level" label for the footer, matching the reference footer
 *  semantics: always "<id> • <level>", with level falling back to "off"
 *  and model id to "no-model". */
export function modelThinkingLabel(
  model: { id?: string } | undefined,
  level: string | undefined,
): string {
  const name = model?.id ?? "no-model";
  const thinking = level ?? "off";
  return `${name} • ${thinking}`;
}

/** Context usage text. When contextWindow is 0 (unknown), returns "?" if
 *  percent is also unknown, or "<pct>%" when percent is known. Otherwise
 *  returns "<pct>%/<window>" (e.g. "42.1%/200k"). Percent is null right
 *  after compaction (tokens unknown until the next LLM response). */
export function contextDisplay(
  percent: number | null | undefined,
  contextWindow: number,
): string {
  const percentText =
    percent === null || percent === undefined ? "?" : `${percent.toFixed(1)}%`;
  if (contextWindow === 0) {
    return percent === null || percent === undefined ? "?" : `${percentText}`;
  }
  return `${percentText}/${formatTokens(contextWindow)}`;
}

/** Color tone for the context usage: warn above 70%, error above 90%. */
export function contextTone(
  percent: number | null | undefined,
): "dim" | "warning" | "error" {
  if ((percent ?? 0) > 90) return "error";
  if ((percent ?? 0) > 70) return "warning";
  return "dim";
}

/** Collapse newlines/tabs and repeated spaces in a single-line status. */
export function sanitizeStatusText(text: string): string {
  return text
    .replace(/[\r\n\t]/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

export interface FooterLayout {
  /** Left text, truncated with a plain "..." ellipsis when out of room. */
  left: string;
  /** Right text — never ellipsized, hard-clipped only if it alone exceeds width. */
  right: string;
  /** Spaces between left and right; total left+gap+right never exceeds width. */
  gap: number;
}

/** Lay out a single footer line: left text flush left, right text
 *  right-aligned, at least `minPad` spaces between them. The left side
 *  yields first (cwd is less important than stats); the right side is
 *  dropped to "" only when it cannot fit even alone. */
export function footerLine(
  left: string,
  right: string,
  width: number,
  minPad = 2,
): FooterLayout {
  const leftWidth = left.length;
  const rightWidth = right.length;

  // Both fit — pad to push the right side against the right edge
  if (leftWidth + minPad + rightWidth <= width) {
    return { left, right, gap: width - leftWidth - rightWidth };
  }

  // Right side fits alone — truncate the left side (keep room for "...")
  if (rightWidth + minPad <= width) {
    const leftAvail = width - rightWidth - minPad;
    const keep = leftAvail - 3; // room for the ellipsis
    const truncated =
      keep > 0 ? `${left.slice(0, keep)}...` : leftAvail > 0 ? "..." : "";
    return {
      left: truncated,
      right,
      gap: Math.max(0, width - truncated.length - rightWidth),
    };
  }

  // Even the right side alone is too wide — hard-clip it
  return { left: "", right: right.slice(0, width), gap: 0 };
}
