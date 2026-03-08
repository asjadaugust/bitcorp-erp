---
name: release
description: 'Full release pipeline — lint, push, PR, merge, tag, deploy. Usage: /release [patch|minor|major|resume]'
user_invocable: true
type: rigid
---

# Release Skill

Full release pipeline: lint → push → PR → CI → merge → tag → deploy → sync.

**Arguments**: `patch` | `minor` | `major` | `resume` | (none = auto-detect from commits)

## Procedure (follow exactly)

### Step 0 — Resume check

Read `.claude/release-state.json`.

- If it exists with `status: "in_progress"`, print a summary of where it left off and **jump to `current_step`**.
- If it exists with `status: "completed"`, delete it and start fresh.
- If it doesn't exist, start fresh from Step 1.

### Step 1 — Validate & lint

- Run `rtk git branch --show-current`. Must be `develop`. **STOP if not.**
- Run `rtk git status`. If uncommitted changes exist → invoke `/lint-commit` first.
- Sync develop with main before proceeding:

```bash
rtk git fetch origin main && rtk git rebase origin/main
```

- If rebase has **conflicts** → **STOP**: "Develop has conflicts with main. Resolve manually before releasing."

- Initialize `.claude/release-state.json`:

```json
{
  "version": null,
  "tag": null,
  "previous_version": null,
  "bump_type": null,
  "branch": "develop",
  "pr_number": null,
  "release_url": null,
  "run_id": null,
  "current_step": 1,
  "status": "in_progress",
  "retry_count": 0,
  "started_at": "<ISO timestamp>",
  "error_log": []
}
```

Update state: `current_step: 2`.

### Step 2 — Determine version

1. Get latest valid tag:

```bash
rtk git tag --sort=-v:refname
```

Parse only tags matching `v<MAJOR>.<MINOR>.<PATCH>` (skip malformed like `v.1.3.4` or `1.0.1`).

2. Get commits since last tag:

```bash
rtk git log v<PREV>..HEAD --oneline
```

- If **zero commits** → **STOP**: "Nothing to release."

3. Determine bump type:
   - If user passed `patch`, `minor`, or `major` → use it.
   - Otherwise auto-detect from commit messages:
     - `BREAKING CHANGE` or `feat!:` → **major**
     - `feat:` or `feat(` → **minor**
     - Everything else → **patch**

4. Calculate new version. Print: `Bumping v1.3.6 → v1.4.0 (minor)`

5. Save `version`, `tag`, `previous_version`, `bump_type` to state. Update `current_step: 3`.

### Step 3 — Push develop

```bash
rtk git push origin develop
```

- On rejection: `rtk git pull --rebase origin develop` then retry **once**.
- On second failure: **STOP** with error.

Update state: `current_step: 4`.

### Step 4 — Create PR

1. Check for existing open PR:

```bash
gh pr list --base main --head develop --state open --json number
```

2. If an open PR exists, **reuse it** (update body if needed). Otherwise create:

```bash
gh pr create --base main --head develop --title "release: v{VERSION}" --body "$(cat <<'EOF'
## Release v{VERSION}

**Bump**: v{PREV} → v{NEW} ({type})

### Changes

#### Features
- commit subject (hash)

#### Bug Fixes
- commit subject (hash)

#### Other
- commit subject (hash)

[Include only sections that have commits. Categorize by conventional commit type.]

### Pre-deploy Checklist
- [ ] CI passes
- [ ] No console errors in staging
- [ ] Migrations backward-compatible
EOF
)"
```

Generate the PR body by parsing `rtk git log v{PREV}..HEAD --oneline` and grouping commits by type prefix (`feat:` → Features, `fix:` → Bug Fixes, everything else → Other). Omit empty sections.

3. Save `pr_number` to state. Update `current_step: 5`.

### Step 5 — Wait for CI

```bash
gh pr checks {PR_NUMBER} --watch
```

- If CI **passes** → continue.
- If CI **fails**:
  1. Read failure details: `gh pr checks {PR_NUMBER}`
  2. Diagnose and attempt to fix locally on `develop`.
  3. Commit fix, push, retry CI. **Max 3 retries.**
  4. After 3 failures → **STOP**: "CI failed 3 times. Manual intervention required."
  5. Log each failure in `error_log`.

Update state: `current_step: 6`.

### Step 6 — Merge PR

```bash
gh pr merge {PR_NUMBER} --rebase --delete-branch=false
```

- **Rebase merge** (not squash) — preserves individual commits on main.
- `--delete-branch=false` — never delete develop.

Verify merge:

```bash
rtk git fetch origin main && rtk git log --oneline origin/main -1
```

Update state: `current_step: 7`.

### Step 7 — Create GitHub Release

1. Generate release notes — same changelog as PR body but **without** the checklist section.

2. Create release:

```bash
gh release create "v{VERSION}" --target main --title "v{VERSION}" --notes "$(cat <<'EOF'
## Release v{VERSION}

**Bump**: v{PREV} → v{NEW} ({type})

### Changes
{changelog without checklist}
EOF
)"
```

3. If release already exists for this tag, skip creation and reuse.

4. Save `release_url` to state. Update `current_step: 8`.

### Step 8 — Monitor release workflow

1. Find the triggered workflow run:

```bash
gh run list --workflow=release.yml --limit=1 --json databaseId,status
```

2. Watch it:

```bash
gh run watch {RUN_ID}
```

3. If it **fails**:
   - Read logs: `gh run view {RUN_ID} --log-failed`
   - Offer to rerun: `gh run rerun {RUN_ID} --failed`
   - **Max 2 retries.** After that → **STOP**: "Release workflow failed. Check GitHub Actions."
   - Log each failure in `error_log`.

4. Save `run_id` to state. Update `current_step: 9`.

### Step 9 — Sync develop

```bash
rtk git checkout develop && rtk git pull --rebase origin main && rtk git push origin develop
```

Update state: `current_step: 10`.

### Step 10 — Complete

Print release summary:

```
✓ Release complete
  Version:  v{VERSION} (v{PREV} → v{NEW})
  PR:       #{PR_NUMBER}
  Release:  {RELEASE_URL}
  Commits:  {COUNT} commits
  Workflow: {RUN_ID} (passed)
```

Update state: `status: "completed"`.

---

## Safety Rules

- **Branch guard** — develop only. Refuse to run on any other branch.
- **No empty releases** — stop if zero commits since last tag.
- **State persistence** — write `.claude/release-state.json` after every step.
- **Retry caps** — CI: 3x, release workflow: 2x. Then stop for human intervention.
- **Never delete develop** — always pass `--delete-branch=false`.
- **Rebase merge** — preserves commit history on main (project convention).
- **Tag format** — always `v<MAJOR>.<MINOR>.<PATCH>`. Skip malformed tags.
- **Idempotent** — reuse existing PR or release if found for this version.
- **Never push to main** — merges go through PR only.

## Error Handling Reference

| Error                           | Action                          |
| ------------------------------- | ------------------------------- |
| Not on develop                  | STOP immediately                |
| Uncommitted changes             | Run `/lint-commit` first        |
| No commits since last tag       | STOP: "Nothing to release"      |
| Push rejected                   | Pull --rebase, retry once       |
| PR already exists               | Reuse existing PR               |
| CI fails                        | Fix, push, retry (max 3x)       |
| Merge conflict                  | STOP: manual resolution needed  |
| Release tag exists              | Reuse existing release          |
| Workflow fails                  | Offer rerun (max 2x), then STOP |
| State file exists (in_progress) | Resume from `current_step`      |
| State file exists (completed)   | Delete and start fresh          |
