# CLAUDE.md

This file provides agent-facing context for the Cook Smart repo. The contents are read automatically on each agent invocation.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `mikeartee/cook-smart` and are managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `tracking`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Ship style

Pull request — every change goes through a feature branch and a PR with `Closes #<issue>`. See `docs/agents/ship-style.md`.

### Project board

GitHub Projects v2 board `cook-smart-mike-review` (https://github.com/users/mikeartee/projects/6). Skills sync the `Status` column with the triage and tdd lifecycle. See `docs/agents/project-board.md`.
