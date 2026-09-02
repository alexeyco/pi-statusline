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
  formatCwd,
  formatTokens,
  modelLabelText,
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

test("formatCwd: home → ~, outside home unchanged", () => {
  const home = "/Users/tester";
  assert.equal(formatCwd("/Users/tester/proj/sub", home), "~/proj/sub");
  assert.equal(formatCwd("/Users/tester", home), "~");
  assert.equal(formatCwd("/tmp/scratch", home), "/tmp/scratch");
  assert.equal(formatCwd("/Users/testerish/x", home), "/Users/testerish/x"); // prefix, not a child
  assert.equal(
    formatCwd("/Users/tester/proj", undefined),
    "/Users/tester/proj",
  );
});

test("modelLabelText: reasoning on/off, no reasoning, no model", () => {
  assert.equal(modelLabelText(undefined, "high"), "no-model");
  assert.equal(
    modelLabelText({ id: "gpt-x", reasoning: false }, "high"),
    "gpt-x",
  );
  assert.equal(
    modelLabelText({ id: "claude", reasoning: true }, "high"),
    "claude • high",
  );
  assert.equal(
    modelLabelText({ id: "claude", reasoning: true }, "off"),
    "claude • thinking off",
  );
  assert.equal(
    modelLabelText({ id: "claude", reasoning: true }, undefined),
    "claude • thinking off",
  );
});

test("contextDisplay: percent and unknown-after-compaction", () => {
  assert.equal(contextDisplay(42.13, 200000), "42.1%/200k");
  assert.equal(contextDisplay(7, 1000000), "7.0%/1M");
  assert.equal(contextDisplay(null, 200000), "?/200k");
  assert.equal(contextDisplay(undefined, 0), "?/0");
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
  const l = footerLine("~/dotfiles (main)", "↑12k ↓4k · 42%/200k", 40);
  assert.equal(l.left, "~/dotfiles (main)");
  assert.equal(l.right, "↑12k ↓4k · 42%/200k");
  assert.equal(l.left.length + l.gap + l.right.length, 40);
});

test("footerLine: tight — left truncated with ellipsis, stats intact", () => {
  const l = footerLine("~/some/very/long/path/here", "↑12k ↓4k · 42%/200k", 30);
  assert.ok(l.right.startsWith("↑12k"), "stats must survive");
  assert.ok(l.left.endsWith("..."));
  assert.ok(l.left.length + l.gap + l.right.length <= 30);
});

test("footerLine: degenerate widths never exceed width", () => {
  for (const width of [0, 1, 5, 12]) {
    const l = footerLine(
      "~/dotfiles (main) • session",
      "↑12k ↓4k · 42%/200k",
      width,
    );
    assert.ok(
      l.left.length + l.gap + l.right.length <= width,
      `width=${width}`,
    );
  }
});
