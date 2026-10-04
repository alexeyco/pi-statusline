/**
 * Tests for status-layout pure helpers.
 *
 * Run: node --test src/status.test.ts  (also `make test`)
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  contextDisplay,
  contextTone,
  footerLine,
  formatTokens,
  modelThinkingLabel,
  sanitizeStatusText,
} from "./status.ts";

test("formatTokens: magnitudes and boundaries", () => {
  assert.equal(formatTokens(0), "0");
  assert.equal(formatTokens(999), "999");
  assert.equal(formatTokens(1000), "1k");
  assert.equal(formatTokens(1500), "1.5k");
  assert.equal(formatTokens(9999), "10k");
  assert.equal(formatTokens(123456), "123k");
  assert.equal(formatTokens(1500000), "1.5M");
  assert.equal(formatTokens(9999999), "10M");
  assert.equal(formatTokens(25000000), "25M");
});

test("modelThinkingLabel: always shows level, falls back to off/no-model", () => {
  assert.equal(modelThinkingLabel(undefined, "high"), "no-model • high");
  assert.equal(modelThinkingLabel({ id: "gpt-x" }, undefined), "gpt-x • off");
  assert.equal(modelThinkingLabel({ id: "claude" }, "high"), "claude • high");
  assert.equal(modelThinkingLabel({ id: "claude" }, "off"), "claude • off");
  assert.equal(modelThinkingLabel(undefined, undefined), "no-model • off");
});

test("contextDisplay: percent and unknown-after-compaction", () => {
  assert.equal(contextDisplay(42.13, 200000), "42.1%/200k");
  assert.equal(contextDisplay(7, 1000000), "7.0%/1M");
  assert.equal(contextDisplay(null, 200000), "?/200k");
});

test("contextDisplay: contextWindow 0 (unknown)", () => {
  assert.equal(contextDisplay(null, 0), "?");
  assert.equal(contextDisplay(undefined, 0), "?");
  assert.equal(contextDisplay(42.1, 0), "42.1%");
});

test("contextTone: thresholds at 70% and 90%", () => {
  assert.equal(contextTone(42), "dim");
  assert.equal(contextTone(70), "dim");
  assert.equal(contextTone(70.1), "warning");
  assert.equal(contextTone(90), "warning");
  assert.equal(contextTone(90.5), "error");
  assert.equal(contextTone(null), "dim");
});

test("sanitizeStatusText: single clean line", () => {
  assert.equal(sanitizeStatusText("a\nb\tc  d"), "a b c d");
  assert.equal(sanitizeStatusText("  spaced  out  "), "spaced out");
});

test("footerLine: both sides fit — right-aligned", () => {
  const l = footerLine("claude • high • 42.1%/200k", "MCP: 3", 60);
  assert.equal(l.left, "claude • high • 42.1%/200k");
  assert.equal(l.right, "MCP: 3");
  assert.equal(l.left.length + l.gap + l.right.length, 60);
});

test("footerLine: tight — left truncated with ellipsis, MCP intact", () => {
  const l = footerLine("claude • high • 42.1%/200k", "MCP: 3", 20);
  assert.equal(l.right, "MCP: 3");
  assert.ok(l.left.endsWith("..."));
  assert.ok(l.left.length + l.gap + l.right.length <= 20);
});

test("footerLine: degenerate widths never exceed width", () => {
  for (const width of [0, 1, 5, 12]) {
    const l = footerLine("claude • high • 42.1%/200k", "MCP: 3", width);
    assert.ok(
      l.left.length + l.gap + l.right.length <= width,
      `width=${width}`,
    );
  }
});

test("footerLine: minPad controls minimum gap between sides", () => {
  // width=30, left=10, right=10, minPad=5 → both fit, gap = 30-10-10 = 10
  const l1 = footerLine("0123456789", "0123456789", 30, 5);
  assert.equal(l1.left, "0123456789");
  assert.equal(l1.right, "0123456789");
  assert.equal(l1.gap, 10);

  // minPad=15 → doesn't fit (10+15+10=35 > 30), left truncated
  const l2 = footerLine("0123456789", "0123456789", 30, 15);
  assert.equal(l2.right, "0123456789");
  assert.ok(l2.left.endsWith("..."));
  assert.ok(l2.left.length + l2.gap + l2.right.length <= 30);
});

test("footerLine: right side alone exceeds width — left becomes empty", () => {
  const l = footerLine("left", "this-right-side-is-very-long", 10);
  assert.equal(l.left, "");
  assert.equal(l.right, "this-right");
  assert.equal(l.gap, 0);
  assert.equal(l.right.length, 10);
});
