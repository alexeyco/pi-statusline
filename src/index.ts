/**
 * status-layout — relocates status info in the pi TUI.
 *
 * - Editor: "model • thinking" label on the top input border, right-aligned
 *   and closed by a border dash so the line still reaches the edge.
 * - Footer: single line — cwd (branch • session) on the left,
 *   "↑in ↓out · ctx%/window" right-aligned. Model/thinking/provider are
 *   removed from the footer (they live on the editor border now); cache
 *   stats (R/W/CH%) and cost are dropped entirely.
 * - Extension statuses (ctx.ui.setStatus) stay on their own line below.
 *
 * Pure layout/formatting logic lives in ./status.ts (unit-tested, no pi
 * imports). This file only wires it to the pi APIs and applies styling.
 */

import {
  CustomEditor,
  type ExtensionAPI,
  type KeybindingsManager,
} from "@earendil-works/pi-coding-agent";
import {
  truncateToWidth,
  visibleWidth,
  type EditorTheme,
  type TUI,
} from "@earendil-works/pi-tui";

import {
  contextDisplay,
  contextTone,
  footerLine,
  formatCwd,
  formatTokens,
  modelLabelText,
  sanitizeStatusText,
} from "./status.ts";

/** Closing border character after the label — keeps the border line
 *  running all the way to the right edge. */
const LABEL_CLOSE = "─";

/**
 * The stock editor with the model/thinking label stamped onto its top
 * border. Everything except rendering is inherited unchanged.
 */
class LabeledEditor extends CustomEditor {
  /** Label text provider — read on every render, so model/thinking
   *  switches show up on the next re-render without extra hooks. */
  private readonly getLabelText: () => string;

  constructor(
    tui: TUI,
    theme: EditorTheme,
    keybindings: KeybindingsManager,
    getLabelText: () => string,
  ) {
    super(tui, theme, keybindings);
    this.getLabelText = getLabelText;
  }

  render(width: number): string[] {
    const lines = super.render(width);
    if (lines.length === 0) return lines;

    const text = this.getLabelText().trim();
    if (!text) return lines;

    // " model • thinking " — spaces separate the label from the border line;
    // LABEL_CLOSE re-closes the line at the right edge
    const label = ` ${text} ` + LABEL_CLOSE;
    const room = width - visibleWidth(label);
    if (room <= 0) return lines; // terminal too narrow — plain border

    // Line 0 is the top border; when scrolled it carries an "↑ +N"
    // indicator on the left. Trimming from the right preserves it.
    const border = lines[0]!;
    const trimmed = truncateToWidth(border, room, "");
    const pad = " ".repeat(Math.max(0, room - visibleWidth(trimmed)));

    lines[0] = trimmed + pad + this.borderColor(label);
    return lines;
  }
}

/** Sum token usage across all session entries: assistant messages, tool
 *  results and branch/compaction summaries each carry their own usage. */
function tokenTotals(
  entries: Iterable<{ type: string; message?: unknown; usage?: unknown }>,
) {
  let input = 0;
  let output = 0;

  for (const entry of entries) {
    let usage: { input: number; output: number } | undefined;

    if (entry.type === "message") {
      const message = entry.message as
        { role: string; usage?: { input: number; output: number } } | undefined;
      if (message?.role === "assistant" || message?.role === "toolResult") {
        usage = message.usage;
      }
    } else if (entry.type === "branch_summary" || entry.type === "compaction") {
      usage = (entry as { usage?: { input: number; output: number } }).usage;
    }

    if (usage) {
      input += usage.input;
      output += usage.output;
    }
  }

  return { input, output };
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    // --- Footer: single line, stats right-aligned -------------------------
    ctx.ui.setFooter((tui, theme, footerData) => {
      // Re-render when the git branch watcher fires
      const dispose = footerData.onBranchChange(() => tui.requestRender());

      return {
        dispose,
        invalidate() {},
        render(width: number): string[] {
          const { input, output } = tokenTotals(
            ctx.sessionManager.getEntries() as never,
          );

          // Context usage; percent is null right after compaction
          const contextUsage = ctx.getContextUsage();
          const contextWindow =
            contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
          const percent = contextUsage?.percent;
          const tone = contextTone(percent);

          // Layout happens on plain strings (see status.ts), styling after.
          // Styling never changes visible width, so widths stay valid.
          const rightPlain: string[] = [];
          if (input) rightPlain.push(`↑${formatTokens(input)}`);
          if (output) rightPlain.push(`↓${formatTokens(output)}`);
          rightPlain.push(contextDisplay(percent, contextWindow));

          let leftPlain = formatCwd(
            ctx.sessionManager.getCwd(),
            process.env.HOME || process.env.USERPROFILE,
          );
          const branch = footerData.getGitBranch();
          if (branch) leftPlain += ` (${branch})`;
          const sessionName = ctx.sessionManager.getSessionName();
          if (sessionName) leftPlain += ` • ${sessionName}`;

          const { left, right, gap } = footerLine(
            leftPlain,
            rightPlain.join(" · "),
            width,
          );

          // Style: cwd dim (ellipsis included); tokens dim; context by tone
          const styledRight: string[] = [];
          if (input)
            styledRight.push(theme.fg("dim", `↑${formatTokens(input)}`));
          if (output)
            styledRight.push(theme.fg("dim", `↓${formatTokens(output)}`));
          styledRight.push(
            theme.fg(tone, contextDisplay(percent, contextWindow)),
          );

          const lines = [
            theme.fg("dim", left) +
              " ".repeat(gap) +
              styledRight.join(theme.fg("dim", " · ")),
          ];

          // Extension statuses (ctx.ui.setStatus) below, one shared line
          const statuses = footerData.getExtensionStatuses();
          if (statuses.size > 0) {
            const statusLine = Array.from(statuses.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([, text]) => sanitizeStatusText(text))
              .join(" ");
            lines.push(
              truncateToWidth(statusLine, width, theme.fg("dim", "...")),
            );
          }

          return lines;
        },
      };
    });

    // --- Editor: model/thinking on the top border -------------------------
    ctx.ui.setEditorComponent(
      (tui, theme, keybindings) =>
        new LabeledEditor(tui, theme, keybindings, () =>
          modelLabelText(ctx.model, ctx.thinkingLevel),
        ),
    );
  });
}
