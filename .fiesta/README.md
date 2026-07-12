# `.fiesta/` — M@S's harness contract

How M@S drives the fiesta automation harness as a tenant. The harness holds no
M@S-specific knowledge; everything M@S-specific lives here.

| File               | What it declares                                                       |
| ------------------ | ---------------------------------------------------------------------- |
| `manifest.yaml`    | Identity (`org`/`product`/`repo`) and the shared mental models to use. |
| `gates.yaml`       | Verification gates — replaces the harness's built-in set when present. |
| `floor/gates.yaml` | Vendored acom org-floor snapshot, linted against in CI (INV-3).        |
| `preview.yaml`     | Branch preview URLs and the visual gate's surface catalog.             |
| `pr.yaml`          | Branch naming (Jira-key-first) and the PR body template.               |
| `scripts/`         | Gate and CI helpers.                                                   |
| `workflows/*.yaml` | M@S workflows composed from harness capability handlers.               |

## Gates

Six gates after a one-time `npm ci` provision:

- **lint** — eslint over the diff's JS files (CI doesn't lint; the tree has old debt).
- **format** — `npx prettier --check .`, same as CI.
- **unit-tests** — `npm test` across all workspaces, incl. coverage thresholds.
- **dist-sync** — rebuild bundle + docs, fail on drift (demo pages load the
  checked-in `dist/mas.js`).
- **adversary** — independent-model diff review, required by the acom floor.
- **visual** — screenshots the surfaces the catalog routes the change to; a
  change nothing can render escalates to a human.

No structure gate: test co-location is already enforced by the runner globbing
plus coverage thresholds.

## Preview

Branches serve at `<branch>--mas--<owner>.aem.page`. Feature branches must be
named `MWPW-XXXXXX` (IMS regex), which is why `pr.yaml` puts the Jira key first.
Authenticated surfaces like `/studio.html` need IMS credentials; the docs
galleries render without auth. Studio has no surface yet — adding one takes an
`auth_profiles` entry plus a `capture_hosts` binding.

## Mental models

`manifest.yaml` selects shared models by id; content resolves from the registry
at run time rather than being copied into each repo.

## Workflows

`workflows/restyle-component.yaml` composes `codegen.generate` →
`approval.request`; the harness namespaces it to `mas.restyle-component`.
