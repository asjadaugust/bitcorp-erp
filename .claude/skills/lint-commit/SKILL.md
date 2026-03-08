---
name: lint-commit
description: Auto-fix lint/format issues across backend and frontend, then commit with a conventional `style(scope)` commit. Use at the end of feature work to clean up before pushing.
user_invocable: true
type: rigid
---

# Lint-Commit Skill

Auto-fix lint and formatting issues, then commit them separately from feature work.

## Procedure (follow exactly)

### Step 1 — Baseline

Run `rtk git status` to check the working tree.

- If there are **unstaged feature changes** (not just lint fixes), **STOP and ask the user** whether to proceed — staging everything will mix feature and style changes.
- If tree is clean or only has staged changes, continue.

### Step 2 — Sync with main

```bash
rtk git branch --show-current
```

- If on `develop`:

```bash
rtk git fetch origin main && rtk git rebase origin/main
```

- If rebase has **conflicts** → **STOP**: "Develop has conflicts with main. Resolve manually before linting."
- If **not** on `develop` → **skip this step** (the skill may be used on feature branches).

### Step 3 — Backend lint fix

```bash
cd backend && ruff check app/ tests/ --fix
```

- If ruff reports **unfixable errors**, STOP and report them to the user. Do not continue.

### Step 4 — Frontend lint fix

```bash
cd frontend && npm run lint:fix
```

- If ESLint reports **unfixable errors**, STOP and report them to the user. Do not continue.

### Step 5 — Prettier format

```bash
npm run format
```

Run from project root.

### Step 6 — Check diff

```bash
rtk git diff --stat
```

- If **nothing changed**, report "All clean — nothing to fix" and **STOP**.

### Step 7 — Determine scope

Based on which directories have changes:

| Changed dirs     | Scope |
| ---------------- | ----- |
| `backend/` only  | `api` |
| `frontend/` only | `ui`  |
| Both or other    | `app` |

### Step 8 — Stage and commit

```bash
rtk git add .
rtk git commit -m "style(SCOPE): auto-fix lint and formatting issues"
```

- Replace `SCOPE` with the value from Step 7.
- Commit type is always `style`.
- **Never push.** Local commit only.

### Step 9 — Verify

```bash
rtk git status
```

Confirm the working tree is clean (or only has unrelated changes).

## Safety Rules

- **Stop on unfixable errors** — never commit broken code
- **Warn on mixed changes** — ask before staging if unstaged feature work exists
- **Never push** — local commit only
- **Skip empty** — if no files changed after fixes, say so and stop
- **Rebase only** — always rebase on main, never merge — merges spoil git history
- **Incremental commits** — group changes into logical incremental commits by feature/scope rather than one big commit
