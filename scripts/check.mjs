#!/usr/bin/env node
// Repo sanity checks. Run locally (`node scripts/check.mjs`) and in CI
// (.github/workflows/ci.yml).

import { existsSync, readFileSync } from "node:fs";

const MAX_DESCRIPTION = 200;

let failed = false;
const fail = (msg) => {
  console.error(`check: ${msg}`);
  failed = true;
};

// --- package.json ---

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

if (!pkg.name || !pkg.version) fail("package.json: missing name or version");
if (!pkg.files?.includes("src")) fail('package.json: files must include "src"');
if (!pkg.pi?.extensions?.includes("./src/index.ts"))
  fail('package.json: pi.extensions must include "./src/index.ts"');
for (const keyword of ["pi-package", "pi-extension"])
  if (!pkg.keywords?.includes(keyword))
    fail(`package.json: keywords must include "${keyword}"`);
if (pkg.description?.length > MAX_DESCRIPTION)
  fail(
    `package.json: description is ${pkg.description.length} chars, keep it under ${MAX_DESCRIPTION}`,
  );

// --- extension sources ---

for (const path of pkg.pi?.extensions ?? []) {
  if (!existsSync(path)) fail(`pi.extensions: ${path} does not exist`);
}

for (const path of ["src/index.ts", "src/status.ts", "src/status.test.ts"]) {
  if (!existsSync(path)) fail(`${path}: not found`);
}

// The pure module must stay pure (no pi imports) — keeps it unit-testable.
if (existsSync("src/status.ts")) {
  const status = readFileSync("src/status.ts", "utf8");
  if (/@earendil-works|@signalridge/.test(status))
    fail("src/status.ts: must not import pi packages (pure module)");
}

// --- changelog ---

{
  const headings = readFileSync("CHANGELOG.md", "utf8")
    .match(/^## \S+/gm)
    ?.map((h) => h.slice(3));
  const latest = headings?.[0];
  if (!latest) fail("CHANGELOG.md: no `## <version>` headings");
  else if (latest !== pkg.version)
    fail(
      `CHANGELOG.md: latest entry ${latest} != package.json version ${pkg.version}`,
    );
}

// --- gallery ---

for (const path of ["docs/gallery/terminal.svg", "docs/gallery/terminal.png"]) {
  if (!existsSync(path)) fail(`${path}: not found`);
}

if (failed) process.exit(1);
console.log("check: OK");
