# 1. Record architecture decisions

**Date:** 2026-05-16
**Status:** Accepted

## Context

We have not been recording architectural decisions in a structured way. Cook Smart has accumulated decisions (e.g. AWS deployment topology, FatSecret as the recipe corpus, the `likes×1 + comments×2 + shares×3` trending formula) that contributors and agents need to discover and respect, but those decisions live scattered across steering files, code comments, and chat history.

## Decision

We will use Architectural Decision Records, in the format described by [Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), stored as Markdown files under `docs/adr/`.

Each ADR is a small file with the headings: Context, Decision, Status, Consequences. Files are numbered sequentially (`0001-...`, `0002-...`, etc.) and never renumbered or deleted. When a decision is reversed, a new ADR with status `Accepted` is created and the old one is updated to `Superseded by ADR-NNNN`.

## Consequences

- Skills (`improve-codebase-architecture`, `diagnose`, `tdd`, `grill-with-docs`) and contributors have a single, ordered place to discover past decisions.
- Decisions become visible in code review (an ADR PR is a focused conversation about one decision, separate from the code that implements it).
- New decisions take a few minutes to write up. Decisions that are obvious or trivial should not become ADRs (see `docs/agents/domain.md` for the bar).
