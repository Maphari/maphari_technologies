# P0 Group 4: Stylelint Setup + .gitignore Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stylelint enforcement to the web app's CSS surface, exclude build artifacts from git, and add the CI gate — without breaking existing camelCase CSS module class names.

**Architecture:** `stylelint` + `stylelint-config-standard` are installed as dev dependencies. A `.stylelintrc.json` configures rules appropriate for this codebase (crucially `selector-class-pattern: null` for camelCase module names). A `.stylelintignore` excludes generated/build paths. A baseline auto-fix pass resolves existing violations before the CI gate is enabled.

**Tech Stack:** stylelint, stylelint-config-standard, pnpm workspaces

**Spec:** `docs/superpowers/specs/2026-03-30-production-readiness-30day-design.md` — Group 4

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/package.json` | Modify | Add stylelint dev deps + `lint:styles` / `lint:styles:fix` scripts |
| `apps/web/.stylelintrc.json` | Create | Stylelint config with camelCase class name support |
| `apps/web/.stylelintignore` | Create | Exclude generated, build, and test-result paths |
| `apps/web/.gitignore` | Modify | Add `tmp/` and `test-results/` |

---

## Task 1: Install stylelint and verify compatibility

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Check current stylelint version availability**

```bash
pnpm info stylelint version
pnpm info stylelint-config-standard version
```

Note the latest versions. They should be compatible (both are actively maintained and track each other).

- [ ] **Step 2: Add dependencies**

```bash
pnpm --filter @maphari/web add -D stylelint stylelint-config-standard
```

- [ ] **Step 3: Verify installation succeeded**

```bash
pnpm --filter @maphari/web exec stylelint --version
```

Expected: prints a version number (e.g. `16.x.x`)

- [ ] **Step 4: Add lint scripts to package.json**

Open `apps/web/package.json`. In the `scripts` section, add:

```json
"lint:styles": "stylelint 'src/**/*.css'",
"lint:styles:fix": "stylelint 'src/**/*.css' --fix"
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): install stylelint and stylelint-config-standard, add lint:styles scripts"
```

---

## Task 2: Create stylelint config

**Files:**
- Create: `apps/web/.stylelintrc.json`

- [ ] **Step 1: Create config file**

Create `apps/web/.stylelintrc.json`:

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "selector-class-pattern": null,
    "max-nesting-depth": 2,
    "declaration-block-no-duplicate-properties": true,
    "no-duplicate-selectors": true,
    "color-no-invalid-hex": true,
    "unit-no-unknown": true
  }
}
```

**Why `selector-class-pattern: null`:** The codebase uses camelCase CSS module class names (e.g. `badgeGreen`, `topbarStatusAmber`, `pfPurple`). These are referenced dynamically in TypeScript and must not be renamed. The default config enforces kebab-case — disabling this rule is required.

- [ ] **Step 2: Verify config is valid by doing a dry run on one small file**

```bash
pnpm --filter @maphari/web exec stylelint src/app/style/landing-reference.module.css --no-fix 2>&1 | head -20
```

Expected: either lists violations (which is fine at this stage) or exits cleanly. Should NOT print a config error.

- [ ] **Step 3: Commit**

```bash
git add apps/web/.stylelintrc.json
git commit -m "chore(web): add stylelint config with camelCase module class name support"
```

---

## Task 3: Create .stylelintignore

**Files:**
- Create: `apps/web/.stylelintignore`

- [ ] **Step 1: Create ignore file**

Create `apps/web/.stylelintignore`:

```
tmp/**
test-results/**
.next/**
node_modules/**
src/generated/**
```

- [ ] **Step 2: Verify ignored paths are excluded**

```bash
# Should print nothing (ignored):
pnpm --filter @maphari/web exec stylelint '.next/**/*.css' 2>&1 | head -5
```

Expected: no output or "No files matching the pattern" (not a config error)

- [ ] **Step 3: Commit**

```bash
git add apps/web/.stylelintignore
git commit -m "chore(web): add .stylelintignore for generated/build/test paths"
```

---

## Task 4: Update .gitignore

**Files:**
- Modify: `apps/web/.gitignore`

- [ ] **Step 1: Add missing entries**

Open `apps/web/.gitignore`. If `tmp/` and `test-results/` are not already present, add them:

```
tmp/
test-results/
```

- [ ] **Step 2: Remove any tracked tmp or test-results files from git index**

```bash
git ls-files apps/web/tmp apps/web/test-results 2>/dev/null
```

If any files are listed, remove them from git tracking:

```bash
git rm -r --cached apps/web/tmp/ apps/web/test-results/ 2>/dev/null || true
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/.gitignore
git commit -m "chore(web): exclude tmp/ and test-results/ from git tracking"
```

---

## Task 5: Baseline fix pass

This task auto-fixes existing violations so the CI gate can be enabled without blocking current PRs.

- [ ] **Step 1: Run auto-fix on entire CSS surface**

```bash
pnpm --filter @maphari/web lint:styles:fix
```

This will auto-fix many issues (property ordering, whitespace, etc.). Let it run to completion.

- [ ] **Step 2: Check for remaining unfixable violations**

```bash
pnpm --filter @maphari/web lint:styles 2>&1 | tail -30
```

Review any remaining violations. Common unfixable violations to fix manually:
- `no-duplicate-selectors`: duplicate class selectors in the same file — merge or remove duplicates
- `declaration-block-no-duplicate-properties`: same property declared twice in a block — remove the duplicate
- `max-nesting-depth`: nesting deeper than 2 — flatten the selector

Fix manually until `pnpm --filter @maphari/web lint:styles` exits with code 0.

- [ ] **Step 3: Verify lint:styles passes with exit code 0**

```bash
pnpm --filter @maphari/web lint:styles
echo "Exit code: $?"
```

Expected: `Exit code: 0`

- [ ] **Step 4: Commit the baseline fix**

```bash
git add 'apps/web/src/**/*.css'
git commit -m "chore(web/css): baseline stylelint auto-fix pass — resolves pre-existing violations"
```

---

## Task 6: Add CI gate

**Files:**
- Modify: CI pipeline config (e.g. `.github/workflows/ci.yml` or equivalent)

- [ ] **Step 1: Find the CI configuration file**

```bash
ls .github/workflows/
```

Or check if there's a `Makefile`, `turbo.json`, or other CI runner config.

- [ ] **Step 2: Add stylelint step**

In the CI workflow, add a step after the existing eslint step:

```yaml
- name: Lint styles
  run: pnpm --filter @maphari/web lint:styles
```

Or, if using a Makefile or script, add:
```bash
pnpm --filter @maphari/web lint:styles
```

alongside the existing `pnpm --filter @maphari/web lint` call.

- [ ] **Step 3: Verify CI step works locally**

```bash
pnpm --filter @maphari/web lint:styles
```

Expected: exit code 0 (after baseline fix in Task 5)

- [ ] **Step 4: Commit CI change**

```bash
git add .github/  # or whatever CI config path
git commit -m "ci: add stylelint gate for apps/web CSS surface"
```

---

## Task 7: Final verification

- [ ] **Step 1: Run full lint:styles one more time**

```bash
pnpm --filter @maphari/web lint:styles
```

Expected: exit code 0, no violations

- [ ] **Step 2: Verify selector-class-pattern is disabled**

```bash
pnpm --filter @maphari/web exec stylelint --print-config src/app/style/admin/core.module.css 2>/dev/null | grep "selector-class-pattern"
```

Expected: `"selector-class-pattern": null` (not a pattern string)

- [ ] **Step 3: Spot-check a camelCase class name is not flagged**

```bash
echo ".badgeGreen { color: green; }" | pnpm --filter @maphari/web exec stylelint --stdin-filename=test.module.css
```

Expected: no `selector-class-pattern` violation

- [ ] **Step 4: Verify tmp/ and test-results/ are gitignored**

```bash
git check-ignore -v apps/web/tmp/ apps/web/test-results/ 2>/dev/null
```

Expected: both paths reported as ignored

---

## Acceptance Criteria Checklist

- [ ] `stylelint-config-css-modules` NOT used; `stylelint-config-standard` only
- [ ] `stylelint` version pinned and compatible with `stylelint-config-standard`
- [ ] `lint:styles` and `lint:styles:fix` scripts in `apps/web/package.json` targeting `src/**/*.css`
- [ ] `.stylelintignore` excludes `tmp/`, `test-results/`, `.next/`, `node_modules/`, `src/generated/`
- [ ] `apps/web/.gitignore` includes `tmp/` and `test-results/`
- [ ] Baseline `lint:styles:fix` run and committed before CI gate enabled
- [ ] CI gate fails on stylelint violations
- [ ] `selector-class-pattern: null` confirmed in config (camelCase class names preserved)
