# Contributing

## Branching

- Never push to `master`.
- Branch from `master`: `git checkout -b feat/<topic>`.
- Commit messages: no conventional prefixes (`feat:`, `fix:`, …), past tense —
  e.g. `Extracted statusline extension`, `Fixed footer overflow`.

## Development

- `src/index.ts` — extension wiring (pi APIs, styling); picked up on the next
  session or `/reload` after a local install.
- `src/status.ts` — pure helpers; keep them free of pi/TUI imports.
- `src/status.test.ts` — unit tests.

Test locally without publishing (local installs are not copied, edits are live):

```sh
pi install /absolute/path/to/pi-statusline
```

**Note:** if you still have the old local copy in
`~/.pi/agent/extensions/status-layout/`, move it away while testing —
both copies register and fight over the footer.

Format with `make fmt` (prettier). Run the checks before committing —
same as CI:

```sh
make check   # manifest + layout sanity checks
make test    # unit tests (node:test; needs Node ≥ 22.18 for .ts type stripping)
```

## Publishing

1. Add a `CHANGELOG.md` entry for the new version.
2. Bump `version` in `package.json` (semver).
3. Merge the PR to `master`.
4. Tag and push the tag:

   ```sh
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```

5. The `publish` workflow (.github/workflows/publish.yml) runs `npm publish` on tag push.
   Requires the `NPM_TOKEN` secret in the repo settings.

Install for users:

```sh
pi install npm:@alexeyco/pi-statusline          # latest
pi install npm:@alexeyco/pi-statusline@0.1.0    # pinned
```
