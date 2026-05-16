# Issue tracker — GitHub

Issues for this repo live in GitHub Issues at `mikeartee/cook-smart`. Skills interact with them via the [`gh`](https://cli.github.com/) CLI.

## Repo

- **Owner:** `mikeartee` (user account)
- **Repo:** `mikeartee/cook-smart`
- **Default branch:** see `git symbolic-ref refs/remotes/origin/HEAD`

## Common operations

### Create an issue

```bash
gh issue create \
  --repo mikeartee/cook-smart \
  --title "<title>" \
  --body "<body>" \
  --label "<label>"
```

For agent-ready slices, include `--label ready-for-agent` (see `docs/agents/triage-labels.md`).

### Read an issue

```bash
gh issue view <number> --repo mikeartee/cook-smart --json number,title,body,labels,state,assignees
```

### List issues by label

```bash
gh issue list --repo mikeartee/cook-smart --label ready-for-agent --state open --json number,title,labels
```

### Apply or remove labels

```bash
gh issue edit <number> --repo mikeartee/cook-smart --add-label ready-for-agent --remove-label needs-triage
```

### Close an issue

Direct close (when not closed automatically by a merged PR):

```bash
gh issue close <number> --repo mikeartee/cook-smart --comment "<reason>"
```

In PR-style ship mode, prefer `Closes #<number>` in the PR body so the issue closes on merge — see `docs/agents/ship-style.md`.

### Sub-issues

Parent/child links are tracked via the `Parent issue` field on each issue (visible in the GitHub UI and in Projects v2). Skills that create child issues should reference the parent in the body (`Parent: #<number>`) and apply the `tracking` label to the parent.

## Authentication

Skills assume `gh auth status` shows an authenticated user with the `repo`, `project`, and `read:org` scopes. If `gh` is not authenticated, skills should fail loudly rather than fall back to another tracker.

## Out of scope

This file does not describe label semantics — see `docs/agents/triage-labels.md` for the canonical role mapping.
