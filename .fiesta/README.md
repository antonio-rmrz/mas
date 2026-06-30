# `.fiesta/` — M@S's harness contract

This folder is how M@S (Merch at Scale) drives the **fiesta** automation harness
as a tenant. The harness reads these files at the pinned commit and holds no
M@S-specific knowledge of its own — everything M@S-specific lives here.

| File | What it declares |
|------|------------------|
| `manifest.yaml` | M@S's identity (`org`/`product`/`repo`) and which shared mental models the planner should use. |
| `gates.yaml` | M@S's verification gates. When present, these **replace** the harness's built-in default set. |
| `preview.yaml` | How to turn a branch + page into a live preview URL, for the visual gate. |
| `workflows/*.yaml` | M@S workflows, composed from the harness's capability handlers. |

## Gates

`gates.yaml` declares four gates, mirroring what M@S CI enforces on a
web-components PR:

- **lint** — `npx eslint web-components studio`
- **format** — `npx prettier --check .`
- **unit-tests** — `npm test` (the Web Test Runner suite across workspaces; it
  also enforces the ≥85% branch/statement coverage thresholds in
  `web-test-runner.config.mjs`)
- **visual** — screenshots a component demo page at two breakpoints and routes
  the evidence to a human for sign-off

There is no separate "component structure" gate: M@S enforces test co-location
through the test runner's file globbing plus the coverage thresholds, so a
component without a test fails the unit-tests gate already.

## Preview

`preview.yaml`'s `pin_pattern` substitutes `{branch}` and `{page}`. On Edge
Delivery Services a branch is served at `<branch>--mas--<owner>.aem.page`.
Two M@S specifics: feature branches must be named `MWPW-XXXXXX` (IMS auth), and
authenticated surfaces (e.g. `/studio.html`) need IMS credentials — the
component docs pages (e.g. `/web-components/docs/ccd.html`) render without auth.

## Mental models

`manifest.yaml`'s `mental_models.use` lists the models M@S selects by id. The
selection is M@S's; the model content is shared and resolved from the registry
at run time, so the same models are reused across products rather than copied
into each repo.

## Workflows

`workflows/restyle-component.yaml` composes registered capability handlers
(`codegen.generate` → `mock.approval`). The harness namespaces the id to
`mas.restyle-component`.
