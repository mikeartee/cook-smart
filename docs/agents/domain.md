# Domain docs

This repo uses a **single-context** layout. There is one global `CONTEXT.md` at the repo root and one ADR directory at `docs/adr/`. Skills that consume domain knowledge (`improve-codebase-architecture`, `diagnose`, `tdd`, `grill-with-docs`) read from these two locations.

## Layout

```
cook-smart/
├── CONTEXT.md          # global domain language and concept map
├── docs/
│   └── adr/            # architectural decision records (ADR-NNNN-*.md)
└── ...
```

## Consumer rules

When a skill needs domain context for a change:

1. **Read `CONTEXT.md` first** if it exists. Use the terminology defined there in any new code, comments, commits, PRs, or docs. If the change introduces a new domain concept, propose adding it to `CONTEXT.md` (don't silently invent terms).
2. **Read all ADRs in `docs/adr/`** that touch the area being changed. ADRs supersede each other — a later ADR with status `Accepted` overrides an earlier one with status `Superseded`. Honour every accepted decision unless the user explicitly asks to revisit one.
3. **Propose new ADRs** when a change introduces a non-trivial architectural decision (new dependency category, new data flow, new boundary). Use the standard ADR template (see existing files for examples; if none exist, follow the [Michael Nygard format](https://github.com/joelparkerhenderson/architecture-decision-record/tree/main/locales/en/templates/decision-record-template-by-michael-nygard)).

## Bootstrapping

Neither `CONTEXT.md` nor `docs/adr/` exists yet in this repo. Skills that need them should:

- For `CONTEXT.md`: prompt the user to create one (or scaffold a starter via the `improve-codebase-architecture` skill on first run).
- For `docs/adr/`: create the directory the first time an ADR is needed, starting with `docs/adr/0001-record-architecture-decisions.md` (the Michael Nygard meta-ADR).

## Out of scope

- Per-component context files (`backend/`, `website/`, mobile) are **not** used. The layout is single-context. If the domain language ever diverges enough to warrant per-context files, switch this repo to multi-context by re-running `setup-arc` and adding `CONTEXT-MAP.md`.
