/**
 * status-layout — compact footer for the pi TUI.
 *
 * Footer: single line — "<model> • <thinking>" dim + " • " dim + context usage
 * on the left, "MCP: N" dim on the right. Context usage is colored by tone:
 * >90% error, >70% warning, otherwise dim.
 *
 * Extension statuses (ctx.ui.setStatus) stay on their own dim line below.
 *
 * Pure layout/formatting logic lives in ./status.ts (unit-tested, no pi
 * imports). This file only wires it to the pi APIs and applies styling.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  contextDisplay,
  contextTone,
  footerLine,
  modelThinkingLabel,
  sanitizeStatusText,
} from "./status.ts";

/** Read the number of configured MCP servers from ~/.pi/agent/mcp.json. */
function readMcpCount(): number {
  try {
    const home = process.env.HOME;
    if (!home) return 0;
    const raw = readFileSync(join(home, ".pi", "agent", "mcp.json"), "utf-8");
    return Object.keys(JSON.parse(raw).mcpServers ?? {}).length;
  } catch {
    return 0;
  }
}

export default function (pi: ExtensionAPI) {
  let currentThinking = "off";
  let mcpCount = readMcpCount();

  pi.on("thinking_level_select", (event) => {
    currentThinking = event.level;
  });

  // The event payload lists extension-registered servers, not the mcp.json
  // entries the footer counts — so re-read the file. Handling this event is
  // safe because pi only warns about unconnected MCP servers when no
  // extension handles it (the built-in MCP extension does).
  pi.on("mcp_servers_change", () => {
    mcpCount = readMcpCount();
  });

  pi.on("session_start", (_event, ctx) => {
    currentThinking = ctx.thinkingLevel ?? "off";
    // mcp_servers_change only fires on register/unregister; the built-in MCP
    // extension re-reads mcp.json per session, so refresh here too.
    mcpCount = readMcpCount();

    ctx.ui.setFooter((_tui, theme, footerData) => {
      return {
        dispose() {},
        invalidate() {},
        render(width: number): string[] {
          // Context usage
          const contextUsage = ctx.getContextUsage();
          const contextWindow =
            contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
          const percent = contextUsage?.percent;
          const tone = contextTone(percent);

          // Plain strings for layout (styling applied afterwards)
          const modelStr = modelThinkingLabel(ctx.model, currentThinking);
          const ctxStr = contextDisplay(percent, contextWindow);
          const prefix = `${modelStr} • `;
          const leftPlain = prefix + ctxStr;
          const rightPlain = `MCP: ${mcpCount}`;

          const { left, right, gap } = footerLine(leftPlain, rightPlain, width);

          // Style left: dim prefix ("<model> • <level> • "), context in its
          // tone, "..." dim when truncated.
          const hasEllipsis = left.endsWith("...");
          const kept = hasEllipsis ? left.slice(0, -3) : left;
          const prefixLen = prefix.length;

          let styledLeft: string;
          if (kept.length <= prefixLen) {
            styledLeft = theme.fg("dim", kept);
          } else {
            styledLeft =
              theme.fg("dim", prefix) + theme.fg(tone, kept.slice(prefixLen));
          }
          if (hasEllipsis) {
            styledLeft += theme.fg("dim", "...");
          }

          const lines = [styledLeft + " ".repeat(gap) + theme.fg("dim", right)];

          // Extension statuses below, one shared dim line
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
  });
}
