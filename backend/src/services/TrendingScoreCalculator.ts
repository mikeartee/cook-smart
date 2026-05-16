/**
 * TrendingScoreCalculator — pure-function trending score module.
 *
 * Owns the Bayesian-smoothed trending score formula defined in ADR 0002.
 * No database access, no I/O, no side-effects. Imports only from this file.
 *
 * Formula:
 *
 *   effective_rating = (priorWeight × globalMean + sumOfRatings) / (priorWeight + totalRatings)
 *   score = likes × 1 + comments × 2 + shares × 3 + effective_rating × ratingWeight
 *
 * The Bayesian prior pulls low-volume recipes toward the global mean so a single
 * 5-star rating cannot dominate the trending feed before the recipe has earned signal.
 */

/**
 * Default Bayesian-prior parameters, exported so call sites and tests can share them.
 *
 * - `priorWeight` — number of "phantom average ratings" each recipe starts with.
 *   Larger values pull effective_rating toward globalMean more strongly for sparse data.
 * - `ratingWeight` — coefficient that scales effective_rating's contribution to the score.
 *   At 0.5, a recipe at the global mean adds globalMean × 0.5 to its score.
 * - `globalMean` — assumed mean rating across all rated recipes. Initially hardcoded;
 *   a follow-up issue will recompute periodically.
 */
export const TRENDING_DEFAULTS = {
  priorWeight: 5,
  ratingWeight: 0.5,
  globalMean: 4.0,
} as const;

export interface EngagementInputs {
  likes: number;
  comments: number;
  shares: number;
  /** Sum of integer ratings across all raters. Equivalent to `avg_rating × total_ratings`. */
  sumOfRatings: number;
  totalRatings: number;
}

export interface BayesianRatingParams {
  priorWeight: number;
  ratingWeight: number;
  globalMean: number;
}

/**
 * Compute the Bayesian-smoothed effective rating for a recipe.
 *
 * Returns `globalMean` when the recipe has no ratings (`totalRatings === 0`).
 * As `totalRatings → ∞`, converges to `sumOfRatings / totalRatings` (the raw average).
 */
export function computeEffectiveRating(
  sumOfRatings: number,
  totalRatings: number,
  params: BayesianRatingParams = TRENDING_DEFAULTS,
): number {
  const {priorWeight, globalMean} = params;
  return (
    (priorWeight * globalMean + sumOfRatings) / (priorWeight + totalRatings)
  );
}

/**
 * Compute the trending score for a recipe given its engagement inputs.
 *
 * Inputs are all non-negative numbers. Engagement counts (likes/comments/shares)
 * follow the historical weighting `1/2/3` that the codebase already used. The
 * rating contribution is the Bayesian-smoothed effective rating multiplied by
 * `ratingWeight`.
 */
export function computeTrendingScore(
  inputs: EngagementInputs,
  params: BayesianRatingParams = TRENDING_DEFAULTS,
): number {
  const {likes, comments, shares, sumOfRatings, totalRatings} = inputs;
  const {ratingWeight} = params;

  const engagementScore = likes * 1 + comments * 2 + shares * 3;
  const effectiveRating = computeEffectiveRating(
    sumOfRatings,
    totalRatings,
    params,
  );

  return engagementScore + effectiveRating * ratingWeight;
}
