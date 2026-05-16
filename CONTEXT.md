# Cook Smart — domain context

This file is the canonical glossary for Cook Smart's domain language. Skills and contributors should use these terms exactly as defined.

## Core entities

- **Recipe** — a unit of cookable content. Comes in two flavours, distinguished by `recipe_type`:
  - `api` — sourced from the FatSecret recipe corpus (1M+ recipes, cached in `recipe_cache`).
  - `user` — created by a user, stored in `user_recipes`.
- **User** — an authenticated account. Identified by `user_id` (`VARCHAR(255)`).
- **Ingredient** — an item in a user's pantry/inventory. Tied to barcodes via Open Food Facts.
- **Favorite** — a user's saved recipe (one row per user/recipe in `favorites`).

## Social engagement

These are first-class entities, each with its own table:

- **Like** — a user's positive signal on a recipe. Boolean per (`user_id`, `recipe_id`). Stored in `recipe_likes`.
- **Comment** — text on a recipe. Threaded via `parent_comment_id`. Stored in `recipe_comments`.
- **Share** — a tracked share-to-platform event. Stored in `recipe_shares`.
- **Rating** — a user's 1–5 star score on a recipe, optionally with a written **review**. One per (`user_id`, `recipe_id`, `recipe_type`). Stored in `recipe_ratings`. Distinct from a **like** (boolean) and a **comment** (free text).
- **Cooking history entry** — a record that a user actually cooked a recipe. Optional standalone rating column (separate from `recipe_ratings`). Stored in `recipe_cooking_history`.

> **Rating vs. like.** A like is a low-friction "I like this." A rating is a quality signal (1–5) tied to having tried the recipe. Both are independent — a user can like without rating, rate without liking, or both.

> **Rating vs. cooking-history rating.** `recipe_cooking_history.rating` is a per-cook-event rating (a user might cook the same recipe three times and rate it differently each time). `recipe_ratings` is the canonical aggregate (one row per user/recipe). Discoverability surfaces (cards, trending) read from `recipe_ratings`.

## Discoverability

- **Trending** — recipes ranked by a synthetic engagement score. Stored as a denormalised cache in `trending_recipes`. Recomputed via `SocialService.updateTrendingScore(recipeId)` on every engagement write.
- **Trending score formula** — `score = likes×1 + comments×2 + shares×3 + effective_rating × W`, where `effective_rating` is a Bayesian-smoothed rating (see ADR 0002). `W` is the rating weight (initial value pinned in the ADR).
- **Seasonal** — recipes auto-filtered by current season (Spring/Summer/Fall/Winter). Stored in `seasonal_recipes`.
- **Recipe card** — the compressed UI representation of a recipe in any list (search, trending, seasonal, favorites). The shared component is `src/components/RecipeCard.tsx`; some screens use bespoke cards.

## Recipe rating system — canonical implementation

Two implementations existed historically; only one is canonical going forward:

- **`backend/src/services/RecipeEnhancementService.ts`** — the live, wired-up implementation. Used by route `/api/v1/recipe-enhancements/ratings` and by the mobile `recipeEnhancementService.ts`.
- ~~`backend/src/models/RecipeRating.ts`~~ — dead code. Zero callers. References nonexistent columns (`date_created`/`date_updated`) and a nonexistent `recipes` table. **To be deleted** as part of the rating-system hardening work (see PRD).

## Denormalised aggregates

To keep recipe-list reads cheap, the following aggregates are stored on `recipe_cache` and `trending_recipes` and refreshed by `updateTrendingScore`:

| Column                    | Source query                                                            |
|---------------------------|-------------------------------------------------------------------------|
| `view_count`              | maintained by view tracking                                             |
| `save_count`              | maintained by favorite writes                                           |
| `trending_score`          | `likes×1 + comments×2 + shares×3 + effective_rating × W`                |
| `avg_rating` *(new)*      | `AVG(rating)` over `recipe_ratings WHERE recipe_id = ? AND recipe_type` |
| `total_ratings` *(new)*   | `COUNT(*)`  over `recipe_ratings WHERE recipe_id = ? AND recipe_type`   |

## Out of scope of this glossary

- Auth/session/email flows — see `backend/src/services/auth*.ts`.
- Subscription/billing — see `subscriptions/`, Stripe integration.
- Admin/analytics — see `routes/admin*.ts`.
