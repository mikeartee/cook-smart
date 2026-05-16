# 3. Denormalise rating aggregates onto recipe_cache

**Date:** 2026-05-16
**Status:** Accepted

## Context

The recipe rating system needs to surface average rating and total ratings count on recipe cards in list views (Trending, Seasonal, Search, Favorites, etc.). Three options were considered for getting that data into the UI:

1. **Compute on the fly.** `LEFT JOIN recipe_ratings` and `GROUP BY` on every list query. Always fresh, no schema change. Costs an aggregation per recipe per list query.
2. **Batched fetch.** A new endpoint `GET /api/v1/recipe-enhancements/ratings/bulk?ids=...` that the frontend calls after the list query. Frontend merges. One extra round trip per screen.
3. **Denormalise.** Add `avg_rating` and `total_ratings` columns to `recipe_cache` and `trending_recipes`, refreshed inside `SocialService.updateTrendingScore(recipeId)`. Card endpoints return them with no extra work.

The codebase already follows pattern (3) for `view_count`, `save_count`, and `trending_score` — these are denormalised counts maintained synchronously by the engagement write path.

## Decision

Add denormalised columns to the cache tables:

- `recipe_cache.avg_rating DECIMAL(3,2) DEFAULT 0`
- `recipe_cache.total_ratings INTEGER DEFAULT 0`
- `trending_recipes.avg_rating DECIMAL(3,2) DEFAULT 0`
- `trending_recipes.total_ratings INTEGER DEFAULT 0`

Refresh them inside `SocialService.updateTrendingScore(recipeId)`, alongside the existing trending score computation. Call this from `RecipeEnhancementService.rateRecipe()` synchronously after each rating upsert.

## Consequences

**Positive:**

- Card list reads are unchanged in shape and cost. Existing `SELECT * FROM recipe_cache ORDER BY trending_score DESC` returns the rating fields automatically.
- Consistent with the existing engagement-aggregate pattern (`view_count`, `save_count`, `trending_score`).
- Eliminates a class of N+1 problems from option 1 and an extra round trip from option 2.

**Negative:**

- Two writes (the `recipe_ratings` upsert and the `recipe_cache` update) must stay consistent. We accept eventual consistency: if the cache update fails, the next `updateTrendingScore` call will reconcile. Any read in the gap will see stale aggregates.
- Schema migration required (one-time backfill of `avg_rating` / `total_ratings` for already-rated recipes — non-trivial only if there is meaningful production rating data).

## Validation

The PRD requires backend unit tests (scope item 6a) covering:

- A new rating updates both `recipe_ratings` and `recipe_cache.avg_rating` / `total_ratings`.
- Updating an existing rating (upsert path) refreshes the denormalised aggregates correctly.
- Deleting a rating (if/when supported) decrements `total_ratings` and recomputes `avg_rating`.
