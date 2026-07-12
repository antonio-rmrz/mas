#!/usr/bin/env bash
# Verify the checked-in web-components build artifacts (dist/ + generated
# docs/) match a fresh build of src/. The demo surfaces load dist/mas.js, so
# stale bundles make visual evidence silently dishonest; upstream CI
# (web-components-pr.yaml) enforces the same invariant on every PR.
set -euo pipefail
cd "$(dirname "$0")/../.."

snapshot() {
    find web-components/dist web-components/docs -type f -print0 |
        sort -z | xargs -0 shasum -a 256 | shasum -a 256
}

before=$(snapshot)
(cd web-components && npm run build:bundle && npm run build:docs)
after=$(snapshot)

if [ "$before" != "$after" ]; then
    echo "FAIL: web-components dist/ or docs/ is out of sync with src/." >&2
    echo "Run 'cd web-components && npm run build:bundle && npm run build:docs'" >&2
    echo "and include the regenerated artifacts in the diff." >&2
    exit 1
fi
echo "OK: web-components build artifacts are in sync"
