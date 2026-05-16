# Triage labels

The `triage` skill walks every issue through six canonical roles. Each role maps to a label string that skills apply via `gh issue edit --add-label`.

This repo uses the **canonical defaults** — each role's label string equals its name.

## Mapping

| Role              | Label string       | Meaning                                                                       |
|-------------------|--------------------|-------------------------------------------------------------------------------|
| Needs triage      | `needs-triage`     | Maintainer needs to evaluate this issue.                                      |
| Needs info        | `needs-info`       | Waiting on the reporter for more information.                                 |
| Ready for agent   | `ready-for-agent`  | Fully specified, AFK-ready — an agent can pick it up with no human context.   |
| Ready for human   | `ready-for-human`  | Needs human implementation (judgement call, novel design, etc.).              |
| Tracking          | `tracking`         | Container/parent issue (e.g. PRD); work lives in sub-issues.                  |
| Won't fix         | `wontfix`          | Will not be actioned.                                                         |

## Bootstrapping the labels

If the labels do not yet exist in GitHub, create them once:

```bash
gh label create needs-triage    --repo mikeartee/cook-smart --color FBCA04 --description "Maintainer needs to evaluate"
gh label create needs-info      --repo mikeartee/cook-smart --color D4C5F9 --description "Waiting on reporter"
gh label create ready-for-agent --repo mikeartee/cook-smart --color 0E8A16 --description "AFK-ready, an agent can pick it up"
gh label create ready-for-human --repo mikeartee/cook-smart --color 1D76DB --description "Needs human implementation"
gh label create tracking        --repo mikeartee/cook-smart --color 5319E7 --description "Container/parent issue"
gh label create wontfix         --repo mikeartee/cook-smart --color CCCCCC --description "Will not be actioned"
```

## State machine

The `triage` skill enforces these transitions:

- New issue → `needs-triage`
- `needs-triage` → `needs-info` (waiting on reporter), `ready-for-agent`, `ready-for-human`, `tracking`, or `wontfix`
- `needs-info` → `needs-triage` (reporter responded) or `wontfix` (stale)
- `ready-for-agent` / `ready-for-human` → closed (work shipped) or back to `needs-triage` (re-scoped)

A single issue should carry exactly one of these labels at a time. Skills should remove the prior role label when applying a new one.
