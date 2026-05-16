# 2. Bayesian smoothing for rating contribution to trending score

**Date:** 2026-05-16
**Status:** Accepted

## Context

The trending recipes feature ranks recipes by a synthetic engagement score. Today the formula is:

```
score = likes × 1 + comments × 2 + shares × 3
```

We are adding ratings as a fourth engagement signal (see PRD: *Recipe rating system — harden + finish*). Three approaches were considered:

1. **Naive weighted sum.** `score += avg_rating × total_ratings × W`. Easy to reason about. But a single 5-star rating from one user contributes the same as 5 likes — low-volume recipes can dominate the trending feed before they have meaningful signal.
2. **Multiplicative quality factor.** `score *= avg_rating / 3`. Penalises low-rated recipes proportionally to their engagement. But a single 1-star rating tanks an otherwise strong recipe, and the multiplicative shape couples quality and engagement in a way that is hard to debug.
3. **Bayesian-smoothed weighted sum.** Add a smoothed rating term that pulls low-volume recipes toward the global mean, so they have to earn enough rating volume before contributing meaningfully.

## Decision

Use Bayesian-smoothed weighted sum:

```
effective_rating = (C × m + Σ ratings) / (C + total_ratings)
score = likes × 1 + comments × 2 + shares × 3 + effective_rating × W
```

Where:

- `m` is the global mean rating across all rated recipes (recomputed periodically, e.g. nightly).
- `C` is the prior weight — how many "phantom average ratings" each recipe starts with. Initial value: `5`.
- `W` is the rating weight in the score. Initial value: `0.5`.
- `Σ ratings` is the sum of integer ratings; equivalent to `avg_rating × total_ratings`, so we store and use the denormalised `avg_rating` and `total_ratings` from `recipe_cache`.

`C` and `W` are configurable constants exported from `backend/src/services/SocialService.ts` (or a constants module) so they can be tuned without a migration.

## Consequences

**Positive:**

- A recipe with one 5-star rating no longer dominates the feed. With `C = 5`, `m = 4.0`, one 5-star gives `effective_rating = (5×4 + 5) / (5 + 1) = 4.17` — only marginally better than the global mean.
- The formula remains additive and monotonic in the existing engagement signals. A rating cannot decrease the score below its pre-rating value (because `effective_rating ≥ 0`).
- `C` and `W` can be tuned without schema changes.

**Negative:**

- `m` (global mean) must be recomputed periodically. We can defer this by hardcoding `m = 4.0` initially and adding the recompute job in a follow-up.
- The formula is harder to explain to non-technical stakeholders than the naive sum. Mitigation: document the formula in `CONTEXT.md` and link to this ADR.
- Property-based testing is non-trivial: invariants like "score is non-decreasing in number of 5-star ratings" must be derived from the formula, not assumed.

## Validation

The PRD requires a property-based test for the Bayesian prior (see scope item 6e). The test must demonstrate:

- `effective_rating(recipe with 0 ratings)` equals `m`.
- `effective_rating` is monotonic in the count of high ratings (≥ `m`) added.
- As `total_ratings → ∞`, `effective_rating → avg_rating`.
