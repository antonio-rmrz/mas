#!/usr/bin/env python3
"""Reference-integrity check for the .fiesta/ tenant contract (R-14).

Validates that the contract files parse with their required shapes, and that
every mental-model id declared in manifest.yaml resolves to a directory in the
shared registry (Adobe-acom/pinata-tool-shelf). Contract-shape problems always
fail; the registry check degrades to a warning when the registry cannot be
cloned (e.g. no token in a fork's CI).
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

FIESTA = Path(__file__).resolve().parents[1]
REGISTRY_URL = "https://github.com/Adobe-acom/pinata-tool-shelf.git"
errors: list[str] = []


def _load(name: str, required: bool = False) -> dict | None:
    path = FIESTA / name
    if not path.exists():
        if required:
            errors.append(f"{name}: missing (required)")
        return None
    try:
        data = yaml.safe_load(path.read_text())
    except yaml.YAMLError as exc:
        errors.append(f"{name}: malformed YAML: {exc}")
        return None
    if not isinstance(data, dict):
        errors.append(f"{name}: must be a mapping")
        return None
    return data


manifest = _load("manifest.yaml", required=True) or {}
for field in ("org", "product", "repo"):
    if not manifest.get(field):
        errors.append(f"manifest.yaml: missing required field '{field}'")

gates = _load("gates.yaml")
if gates is not None:
    for gate_id, defn in (gates.get("gates") or {}).items():
        if not isinstance(defn, dict) or not defn.get("template"):
            errors.append(f"gates.yaml: gate '{gate_id}' needs a template")

preview = _load("preview.yaml")
if preview is not None and not preview.get("pin_pattern"):
    errors.append("preview.yaml: missing pin_pattern")

pr = _load("pr.yaml")
if pr is not None and not pr.get("template"):
    errors.append("pr.yaml: missing template")

for wf in sorted((FIESTA / "workflows").glob("*.yaml")) if (FIESTA / "workflows").is_dir() else []:
    try:
        data = yaml.safe_load(wf.read_text()) or {}
        if not data.get("workflow_id"):
            errors.append(f"workflows/{wf.name}: missing workflow_id")
    except yaml.YAMLError as exc:
        errors.append(f"workflows/{wf.name}: malformed YAML: {exc}")

ids = [str(i) for i in ((manifest.get("mental_models") or {}).get("use") or [])]
if ids:
    with tempfile.TemporaryDirectory() as tmp:
        clone = subprocess.run(
            ["git", "clone", "--depth", "1", REGISTRY_URL, tmp],
            capture_output=True, text=True, timeout=120,
        )
        if clone.returncode != 0:
            print(f"WARN: could not clone the mental-model registry — id check skipped:\n{clone.stderr[-300:]}")
        else:
            available = {p.name for p in (Path(tmp) / "mental-models").iterdir() if p.is_dir()}
            dangling = [i for i in ids if i not in available]
            if dangling:
                errors.append(
                    f"manifest.yaml: mental_models.use ids not in the registry: {dangling} "
                    f"(available: {sorted(available)})"
                )

if errors:
    print("fiesta contract check FAILED:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
print("fiesta contract check passed")
