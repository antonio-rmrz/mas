# `.fiesta/` — M@S's harness contract

This folder is how M@S (Merch at Scale) drives the **fiesta** automation harness
as a tenant. The harness reads these files at the pinned commit and holds no
M@S-specific knowledge of its own — everything M@S-specific lives here.

| File               | What it declares                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifest.yaml`    | M@S's identity (`org`/`product`/`repo`) and which shared mental models the planner should use.                                                                   |
| `gates.yaml`       | M@S's verification gates. When present, these **replace** the harness's built-in default set.                                                                    |
| `floor/gates.yaml` | Vendored snapshot of the acom org floor, used by CI to lint that this contract never weakens it (INV-3). The harness enforces its own packaged copy at run time. |
| `preview.yaml`     | How to turn a branch + page into a live preview URL, plus the surface catalog the visual gate targets.                                                           |
| `pr.yaml`          | Harness branch naming (Jira-key-first — see below) and the PR body template.                                                                                     |
| `scripts/`         | Gate and CI helpers (`check-dist-sync.sh`, `check-contract.py`).                                                                                                 |
| `workflows/*.yaml` | M@S workflows, composed from the harness's capability handlers.                                                                                                  |

## Gates

`gates.yaml` opens with `provision: npm ci` (command gates run in a fresh
worktree and need the pinned devDependencies; CI's extra
`npm add github:adobecom/milo#stage` is vestigial — nothing here imports milo)
and declares six gates:

- **lint** — `npx eslint {js_files}`: eslint over the diff's JS files only.
  Upstream CI has no eslint check and the tree carries pre-existing
  violations, so a repo-wide lint would fail every run on baseline debt.
- **format** — `npx prettier --check .`, exactly like CI's check-formatting.
- **unit-tests** — `npm test` (Web Test Runner suites for web-components and
  studio — including the ≥85% coverage thresholds in
  `web-components/web-test-runner.config.mjs` — plus io/studio's mocha suite).
- **dist-sync** — rebuilds the web-components bundle + generated docs and
  fails on drift. The demo surfaces load the checked-in `dist/mas.js`, so a
  src-only diff renders unchanged on every visual surface; upstream CI
  (`web-components-pr.yaml`) enforces the same invariant.
- **adversary** — independent-model review of the diff before merge, required
  by the acom org floor.
- **visual** — screenshots the surface(s) the catalog routes the change to, at
  two breakpoints, and routes the evidence to a human for sign-off. No default
  page: a change nothing in the catalog can render (today: studio/-only work,
  headless mas-field, io/) escalates instead of being judged on an unrelated
  page.

There is no separate "component structure" gate: M@S enforces test co-location
through the test runner's file globbing plus the coverage thresholds, so a
component without a test fails the unit-tests gate already.

## Preview

`preview.yaml`'s `pin_pattern` substitutes `{branch}` and `{page}`. On Edge
Delivery Services a branch is served at `<branch>--mas--<owner>.aem.page`.
The `surfaces:` catalog maps changed files (fnmatch `match` globs) to the demo
galleries under `web-components/docs/` — code-bus pages whose cards hydrate
real AEM fragments from the shared adobecom DA mount.

Two M@S specifics: feature branches must be named `MWPW-XXXXXX` (the IMS client
regex rejects everything else — `pr.yaml` puts the Jira key first in
`branch_pattern` for exactly this reason), and authenticated surfaces
(e.g. `/studio.html`) need IMS credentials — the component docs pages render
without auth. Studio has no surface in the catalog yet; adding one takes an
`auth_profiles` entry plus a `capture_hosts` binding (see milo's dormant `ims`
profile for a working reference).

## Mental models

`manifest.yaml`'s `mental_models.use` lists the models M@S selects by id. The
selection is M@S's; the model content is shared and resolved from the registry
at run time, so the same models are reused across products rather than copied
into each repo.

## Workflows

`workflows/restyle-component.yaml` composes registered capability handlers
(`codegen.generate` → `approval.request`). The harness namespaces the id to
`mas.restyle-component`.
