# 3. Denormalise rating aggregates onto recipe_cache and trending_recipes

**Date:** 2026-05-16
**Status:** Accepted

## Context

The recipe rating system needs to surface average rating and total ratings count on recipe cards in list views (Trending, Seasonal, Search, Favorites, etc.). Three options were considered for getting that data into the UI:

1. **Compute on the fly.** `LEFT JOIN recipe_ratings` and `GROUP BY` on every list query. Always fresh, no schema change. Costs an aggregation per recipe per list query.
2. **Batched fetch.** A new endpoint `GET /api/v1/recipe-enhancements/ratings/bulk?ids=...` that the frontend calls after the list query. Frontend merges. One extra round trip per screen.
3. **Denormalise.** Add rating-aggregate columns to `recipe_cache` and `trending_recipes`, refreshed inside `SocialService.updateTrendingScore(recipeId)`. Card endpoints return them with no extra work.

The codebase already follows pattern (3) for `view_count`, `save_count`, and `trending_score` — these are denormalised counts maintained synchronously by the engagement write path.

## Decision

Use denormalised columns on the cache tables, named `rating_average` and `rating_count`:

- `recipe_cache.rating_average DECIMAL(3,2) DEFAULT 0`  *(already existed; backfilled in slice #4)*
- `recipe_cache.rating_count INTEGER DEFAULT 0`         *(already existed; backfilled in slice #4)*
- `trending_recipes.rating_average DECIMAL(3,2) DEFAULT 0`  *(added in slice #4)*
- `trending_recipes.rating_count INTEGER DEFAULT 0`        *(added in slice #4)*

Names follow the pre-existing convention on `recipe_cache` (defined in `create_recipe_cache_table.sql`); the originally-drafted column names from this ADR (`avg_rating` / `total_ratings`) were aligned to match the existing schema rather than introducing parallel pairs.

Refresh them inside `SocialService.updateTrendingScore(recipeId, recipeType)`, alongside the existing trending score computation. Call this from `RecipeEnhancementService.rateRecipe()` synchronously after each rating upsert.

## Consequences

**Positive:**

- Card list reads are unchanged in shape and cost. Existing `SELECT * FROM recipe_cache ORDER BY trending_score DESC` returns the rating fields automatically.
- Consistent with the existing engagement-aggregate pattern (`view_count`, `save_count`, `trending_score`).
- Eliminates a class of N+1 problems from option 1 and an extra round trip from option 2.

**Negative:**

- Two writes (the `recipe_ratings` upsert and the cache table update) must stay consistent. We accept eventual consistency: if the cache update fails, the next `updateTrendingScore` call will reconcile. Any read in the gap will see stale aggregates.
- ~~A pre-existing parallel write path on `recipe_cache.rating_average` / `rating_count` exists in `RecipeCacheService.trackInteraction('rate', ...)` (called by `POST /interaction`). Once slice #5 wires `updateTrendingScore` to recompute these columns from `recipe_ratings`, it will overwrite whatever the incremental path writes. The trackInteraction branch should be considered legacy and removed in a follow-up; we don't remove it in this PRD to keep the blast radius small.~~ **Resolved by PRD #14 slice #16:** the legacy write path has been removed from `trackInteraction`, and `POST /interaction` now rejects `interactionType: 'rate'` with HTTP 400 + a redirect message.
- Schema migration required (one-time backfill from `recipe_ratings` for existing rows — already done in slice #4).

## Validation

The PRD requires backend unit tests (scope item 6a) covering:

- A new rating updates both `recipe_ratings` and `recipe_cache.rating_average` / `rating_count`.
- Updating an existing rating (upsert path) refreshes the denormalised aggregates correctly.
- Deleting a rating (if/when supported) decrements `rating_count` and recomputes `rating_average`.
