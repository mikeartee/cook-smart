# Project board — GitHub Projects v2 sync

The `triage`, `to-issues`, and `tdd` skills synchronise the `Status` column of a GitHub Projects v2 board whenever they change an issue's lifecycle. This repo is wired to one board.

## Board

- **Title:** `cook-smart-mike-review`
- **URL:** https://github.com/users/mikeartee/projects/6
- **Owner:** `mikeartee` (user)
- **Number:** `6`
- **Project node ID (`PVT_…`):** `PVT_kwHOBIHFbs4BX3L8`

The repo `mikeartee/cook-smart` is linked to this project, so issues and PRs from this repo show up in the board's pickers.

## Status field

- **Field name:** `Status`
- **Field ID (`PVTSSF_…`):** `PVTSSF_lAHOBIHFbs4BX3L8zhTBIrM`
- **Type:** `ProjectV2SingleSelectField`

### Options

| Option name | Option ID  |
|-------------|------------|
| Backlog     | `231a455e` |
| Ready       | `56b02860` |
| In progress | `ae3122e0` |
| In review   | `03431385` |
| Done        | `01f3c68e` |

## Skill action → Status mapping

Skills emit the option ID for the column the issue should land in.

| Skill action                                                                              | Status option | Option ID  |
|-------------------------------------------------------------------------------------------|---------------|------------|
| `/triage` → `needs-triage` / `needs-info`                                                 | Backlog       | `231a455e` |
| `/triage` → `ready-for-agent` / `ready-for-human`                                         | Ready         | `56b02860` |
| `/triage` → `tracking` / `/to-issues` parent                                              | In progress   | `ae3122e0` |
| `/tdd` step 1 (work begins)                                                               | In progress   | `ae3122e0` |
| `/tdd` ship in PR-style (PR opened)                                                       | In review     | `03431385` |
| `/tdd-parallel` step 4 (integration PR opened) — bulk parent + every integrated sub-issue | In review     | `03431385` |
| `/triage` → `wontfix`                                                                     | Done          | `01f3c68e` |

`/tdd` invoked with `--no-ship` (used by `/tdd-parallel` sub-agents) skips the per-slice "In review" update; the orchestrator handles the bulk transition when the consolidated integration PR opens.

Issue closure (PR merged, direct-push commit, manual close) lands at `Done` automatically via the project's built-in **Auto-close issue** workflow — skills don't write `Done` themselves.

## Updating a card's Status

The card on the board is a `ProjectV2Item`. Skills must:

1. Find the item ID for the issue/PR on this project. Given an issue node ID, query:

   ```graphql
   query($projectId: ID!, $contentId: ID!) {
     node(id: $projectId) {
       ... on ProjectV2 {
         items(first: 50) {
           nodes {
             id
             content {
               ... on Issue { id }
               ... on PullRequest { id }
             }
           }
         }
       }
     }
   }
   ```

   Match where `content.id == $contentId`.

2. If the issue is not yet on the board, add it:

   ```bash
   gh project item-add 6 --owner mikeartee --url https://github.com/mikeartee/cook-smart/issues/<n>
   ```

3. Set the Status option:

   ```bash
   gh project item-edit \
     --id <item-id> \
     --project-id PVT_kwHOBIHFbs4BX3L8 \
     --field-id PVTSSF_lAHOBIHFbs4BX3L8zhTBIrM \
     --single-select-option-id <option-id>
   ```

## Optional: built-in workflows

Visit https://github.com/users/mikeartee/projects/6/workflows to enable two helpful workflows that the project ships with but are off by default:

- **Auto-add to project** — automatically add new issues and PRs from `mikeartee/cook-smart` to the board (filter: `repo:mikeartee/cook-smart is:issue,pr is:open`). Removes the need for skills to call `gh project item-add`.
- **Auto-close issue** — when an issue is closed (via PR merge, direct close, etc.), set its card's Status to `Done`. Means skills never have to write `Done` themselves.

These can't yet be toggled via `gh`; enable them in the UI.
