# Ship style — Pull request

Every code change in this repo reaches the default branch through a pull request. Skills that produce code (`tdd`, `tdd-parallel`, `to-issues` follow-up work) follow this workflow:

## Workflow

1. **Branch from default.** Create a feature branch off the default branch (run `git symbolic-ref refs/remotes/origin/HEAD` to discover its name — currently `fresh-project-migration` per the steering docs). Use a descriptive prefix that matches the auto-PR convention (see the `git-branch` skill).
2. **Commit work.** Make focused commits on the feature branch. Never commit directly to the default branch.
3. **Push the branch.** Use `git push -u origin <branch>` to set up remote tracking.
4. **Open a PR.** Use `gh pr create` with:
   - A concise title (≤70 characters).
   - A body that summarises the change, what was tested, and any blocked features.
   - `Closes #<issue>` (or `Fixes #<issue>` for bugs) on its own line in the body, so GitHub auto-closes the related issue when the PR merges.
5. **The human merges.** Skills do **not** merge PRs autonomously. Wait for the user (or CI policy) to merge.

## Example

```bash
# 1. Branch
git checkout -b feat/<short-slug>

# 2-3. Commit and push
git add <paths>
git commit -m "<conventional-commit-style message>"
git push -u origin feat/<short-slug>

# 4. PR
gh pr create \
  --title "<title>" \
  --body "$(cat <<'EOF'
Summary of the change.

## Tested
- ...

Closes #<issue>
EOF
)"
```

## Why issues close on merge, not on commit

Because every change goes through a PR, the canonical close mechanism is GitHub's [closing keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue). Skills should:

- **Always** include `Closes #<n>` (or `Fixes #<n>`) in the PR body when the PR fully resolves an issue.
- **Never** call `gh issue close` directly when shipping via PR — that races with the auto-close on merge and produces redundant comments.

If a PR partially addresses an issue, link it with `Refs #<n>` instead and leave the issue open.

## `tdd-parallel` exception

`/tdd-parallel` sub-agents run with `--no-ship`: they commit on slice branches but do **not** push or open per-slice PRs. The orchestrator merges every slice branch onto the parent (PRD) branch with `--no-ff` and opens a single integration PR with `Closes #<parent>` and `Closes #<child>` for each integrated child. This is still PR-style — just one PR for the bundle.

## When to deviate

Cook Smart's steering rules require all checks to pass before merge (zero TypeScript errors, zero ESLint errors, zero failing tests, zero security warnings — see `.kiro/steering/project-rules.md`). Skills should run the verification scan locally before pushing and confirm `ALL CHECKS PASSED` before opening the PR.
