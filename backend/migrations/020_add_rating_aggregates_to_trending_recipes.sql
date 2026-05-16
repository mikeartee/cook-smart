-- 020_add_rating_aggregates_to_trending_recipes.sql
--
-- Adds denormalised rating-aggregate columns (`rating_average`, `rating_count`)
-- to `trending_recipes`, and backfills them from `recipe_ratings`.
--
-- Naming note: `recipe_cache` already had `rating_average` and `rating_count`
-- columns from migration `create_recipe_cache_table.sql`. To keep naming
-- consistent across the two tables that the trending pipeline reads/writes,
-- this migration uses the same column names on `trending_recipes` and
-- separately backfills `recipe_cache` (whose columns may not yet have been
-- populated for recipes with existing ratings).
--
-- See ADR 0003 for the denormalisation rationale.
--
-- Idempotent: safe to re-run.

-- ============================================================================
-- 1. Add the new columns to trending_recipes
-- ============================================================================

ALTER TABLE trending_recipes
  ADD COLUMN IF NOT EXISTS rating_average DECIMAL(3,2) NOT NULL DEFAULT 0;

ALTER TABLE trending_recipes
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- 2. Backfill trending_recipes from recipe_ratings
-- ============================================================================
--
-- `recipe_ratings` tracks `recipe_type` ('api' or 'user'), but `trending_recipes`
-- is keyed by `recipe_id` only. We aggregate across all recipe_types per
-- recipe_id, which is the simplest correct interpretation given the table
-- shape. (Slice #5 will pass recipe_type when calling updateTrendingScore so
-- writes are scoped, but this one-time backfill is best-effort.)

UPDATE trending_recipes tr
SET
  rating_average = src.avg_rating,
  rating_count   = src.total_ratings
FROM (
  SELECT
    recipe_id,
    AVG(rating)::DECIMAL(3,2) AS avg_rating,
    COUNT(*)::INTEGER         AS total_ratings
  FROM recipe_ratings
  GROUP BY recipe_id
) AS src
WHERE tr.recipe_id = src.recipe_id;

-- ============================================================================
-- 3. Backfill recipe_cache.rating_average / rating_count
-- ============================================================================
--
-- These columns existed before this migration but have likely never been
-- populated for recipes that already have rows in `recipe_ratings` (the
-- `RecipeCacheService.trackInteraction('rate', ...)` path is incremental
-- only and is not the canonical write path for the rating system — see
-- CONTEXT.md). Backfill so the trending feed's denormalised aggregates
-- reflect existing rating data on the very first read.

UPDATE recipe_cache rc
SET
  rating_average = src.avg_rating,
  rating_count   = src.total_ratings
FROM (
  SELECT
    recipe_id,
    AVG(rating)::DECIMAL(3,2) AS avg_rating,
    COUNT(*)::INTEGER         AS total_ratings
  FROM recipe_ratings
  GROUP BY recipe_id
) AS src
WHERE rc.recipe_id = src.recipe_id;

-- ============================================================================
-- 4. Indexes
-- ============================================================================
--
-- Skip indexes for now. Reads at query time use score-based ordering on
-- `trending_recipes.score` and `recipe_cache.trending_score` (already indexed),
-- not direct ordering by rating. Add indexes if/when a "Top rated" surface is
-- introduced (out of scope per PRD #1).

COMMENT ON COLUMN trending_recipes.rating_average IS
  'Denormalised average rating (1.00-5.00). Maintained by SocialService.updateTrendingScore from recipe_ratings.';

COMMENT ON COLUMN trending_recipes.rating_count IS
  'Denormalised rating count. Maintained by SocialService.updateTrendingScore from recipe_ratings.';
