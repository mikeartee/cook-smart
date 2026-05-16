import * as fc from 'fast-check';
import {
  TRENDING_DEFAULTS,
  computeEffectiveRating,
  computeTrendingScore,
  type BayesianRatingParams,
  type EngagementInputs,
} from './TrendingScoreCalculator';

const NO_ENGAGEMENT: Pick<EngagementInputs, 'likes' | 'comments' | 'shares'> = {
  likes: 0,
  comments: 0,
  shares: 0,
};

/**
 * Floating-point safe comparison for monotonicity properties.
 *
 * `after` is expected to be >= `before`, but tiny LSB drift from intermediate
 * arithmetic can introduce noise on the order of `Number.EPSILON × |value|`.
 * We tolerate that, plus a small absolute floor for values close to zero.
 */
const FLOAT_REL_TOLERANCE = 1e-12;
const FLOAT_ABS_TOLERANCE = 1e-9;
function expectMonotonicNonDecreasing(after: number, before: number): void {
  const tolerance = Math.max(
    FLOAT_ABS_TOLERANCE,
    Math.abs(before) * FLOAT_REL_TOLERANCE,
  );
  expect(after).toBeGreaterThanOrEqual(before - tolerance);
}

/**
 * Arbitrary that produces a valid `(sumOfRatings, totalRatings)` pair by
 * generating an array of integer ratings (1–5) and summing them. This avoids
 * generating physically-impossible inputs like `(sumOfRatings=6e-8, totalRatings=0)`
 * that would violate the monotonicity property the test is checking.
 */
const ratingHistoryArb = fc
  .array(fc.integer({min: 1, max: 5}), {minLength: 0, maxLength: 100})
  .map(ratings => ({
    sumOfRatings: ratings.reduce((acc, r) => acc + r, 0),
    totalRatings: ratings.length,
  }));

describe('computeEffectiveRating', () => {
  describe('boundary cases', () => {
    it('returns globalMean when there are no ratings', () => {
      const result = computeEffectiveRating(0, 0);
      expect(result).toBeCloseTo(TRENDING_DEFAULTS.globalMean, 10);
    });

    it('handles all 5-star ratings', () => {
      // priorWeight=5, globalMean=4.0, 10 ratings of 5 each → sum=50, total=10
      // effective = (5×4 + 50) / (5 + 10) = 70 / 15 ≈ 4.667
      const result = computeEffectiveRating(50, 10);
      expect(result).toBeCloseTo(70 / 15, 5);
    });

    it('handles all 1-star ratings', () => {
      // priorWeight=5, globalMean=4.0, 10 ratings of 1 each → sum=10, total=10
      // effective = (5×4 + 10) / (5 + 10) = 30 / 15 = 2.0
      const result = computeEffectiveRating(10, 10);
      expect(result).toBeCloseTo(2.0, 5);
    });

    it('handles a single 5-star rating without dominating (smoothing intent)', () => {
      // priorWeight=5, globalMean=4.0, 1 rating of 5 → sum=5, total=1
      // effective = (5×4 + 5) / (5 + 1) = 25 / 6 ≈ 4.167
      // The naive average would be 5.0; smoothing pulls it close to globalMean.
      const result = computeEffectiveRating(5, 1);
      expect(result).toBeCloseTo(25 / 6, 5);
      expect(result).toBeLessThan(5);
      expect(result).toBeGreaterThan(TRENDING_DEFAULTS.globalMean);
    });

    it('approaches the raw average for very high totalRatings', () => {
      // 10_000 ratings averaging 4.5 → sum=45_000, total=10_000
      // effective = (5×4 + 45_000) / (5 + 10_000) ≈ 4.4990 (very close to 4.5)
      const result = computeEffectiveRating(45_000, 10_000);
      expect(result).toBeCloseTo(4.5, 2);
    });

    it('respects custom Bayesian parameters', () => {
      const params: BayesianRatingParams = {
        priorWeight: 10,
        ratingWeight: 0.25,
        globalMean: 3.0,
      };
      // (10×3 + 5) / (10 + 1) = 35 / 11 ≈ 3.182
      const result = computeEffectiveRating(5, 1, params);
      expect(result).toBeCloseTo(35 / 11, 5);
    });
  });

  describe('properties (ADR 0002 invariants)', () => {
    it('returns globalMean when totalRatings is 0, regardless of params', () => {
      fc.assert(
        fc.property(
          fc.double({min: 0.1, max: 100, noNaN: true}),
          fc.double({min: 0.1, max: 100, noNaN: true}),
          fc.double({min: 0, max: 5, noNaN: true}),
          (priorWeight, ratingWeight, globalMean) => {
            const params = {priorWeight, ratingWeight, globalMean};
            const result = computeEffectiveRating(0, 0, params);
            expect(result).toBeCloseTo(globalMean, 6);
          },
        ),
      );
    });

    it('is non-decreasing when an additional 5-star rating is added', () => {
      // Note: ADR 0002 originally claimed monotonicity for any rating ≥ globalMean,
      // but property-based testing exposed that this is only true when the new
      // rating is ≥ the current effective_rating (e.g. a 4-star rating added to
      // a recipe whose effective_rating is already 4.17 will decrease it).
      // The strongest unconditional invariant is monotonicity for the maximum
      // rating (5). The ADR has been updated to match.
      fc.assert(
        fc.property(ratingHistoryArb, ({sumOfRatings, totalRatings}) => {
          const before = computeEffectiveRating(sumOfRatings, totalRatings);
          const after = computeEffectiveRating(
            sumOfRatings + 5,
            totalRatings + 1,
          );
          expectMonotonicNonDecreasing(after, before);
        }),
      );
    });

    it('converges to the raw average as totalRatings → ∞', () => {
      fc.assert(
        fc.property(
          fc.double({min: 1, max: 5, noNaN: true}), // chosen average
          avg => {
            const totalRatings = 100_000;
            const sumOfRatings = avg * totalRatings;
            const result = computeEffectiveRating(sumOfRatings, totalRatings);
            // priorWeight=5 against 100_000 ratings → drift < 0.001
            expect(result).toBeCloseTo(avg, 3);
          },
        ),
      );
    });
  });
});

describe('computeTrendingScore', () => {
  describe('boundary cases', () => {
    it('returns 0 + globalMean × ratingWeight when there is no engagement and no ratings', () => {
      const score = computeTrendingScore({
        ...NO_ENGAGEMENT,
        sumOfRatings: 0,
        totalRatings: 0,
      });
      // 0 engagement + (globalMean × ratingWeight) = 4.0 × 0.5 = 2.0
      expect(score).toBeCloseTo(
        TRENDING_DEFAULTS.globalMean * TRENDING_DEFAULTS.ratingWeight,
        6,
      );
    });

    it('weights likes×1, comments×2, shares×3 (legacy behaviour preserved)', () => {
      const score = computeTrendingScore({
        likes: 10,
        comments: 5,
        shares: 2,
        sumOfRatings: 0,
        totalRatings: 0,
      });
      // engagement: 10 + 10 + 6 = 26
      // rating contribution: 4.0 × 0.5 = 2.0
      expect(score).toBeCloseTo(26 + 2.0, 6);
    });

    it('adds the rating contribution on top of engagement', () => {
      const score = computeTrendingScore({
        likes: 1,
        comments: 0,
        shares: 0,
        sumOfRatings: 50,
        totalRatings: 10,
      });
      // engagement: 1
      // effective_rating: (5×4 + 50) / (5 + 10) = 70/15 ≈ 4.667
      // rating contribution: 4.667 × 0.5 ≈ 2.333
      expect(score).toBeCloseTo(1 + (70 / 15) * 0.5, 5);
    });
  });

  describe('properties (ADR 0002 invariants)', () => {
    it('is non-decreasing when likes increase', () => {
      fc.assert(
        fc.property(
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 0, max: 5000}),
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 1, max: 100}),
          (likes, comments, shares, sumOfRatings, totalRatings, delta) => {
            const before = computeTrendingScore({
              likes,
              comments,
              shares,
              sumOfRatings,
              totalRatings,
            });
            const after = computeTrendingScore({
              likes: likes + delta,
              comments,
              shares,
              sumOfRatings,
              totalRatings,
            });
            expectMonotonicNonDecreasing(after, before);
          },
        ),
      );
    });

    it('is non-decreasing when comments increase', () => {
      fc.assert(
        fc.property(
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 0, max: 5000}),
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 1, max: 100}),
          (likes, comments, shares, sumOfRatings, totalRatings, delta) => {
            const before = computeTrendingScore({
              likes,
              comments,
              shares,
              sumOfRatings,
              totalRatings,
            });
            const after = computeTrendingScore({
              likes,
              comments: comments + delta,
              shares,
              sumOfRatings,
              totalRatings,
            });
            expectMonotonicNonDecreasing(after, before);
          },
        ),
      );
    });

    it('is non-decreasing when shares increase', () => {
      fc.assert(
        fc.property(
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 0, max: 5000}),
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 1, max: 100}),
          (likes, comments, shares, sumOfRatings, totalRatings, delta) => {
            const before = computeTrendingScore({
              likes,
              comments,
              shares,
              sumOfRatings,
              totalRatings,
            });
            const after = computeTrendingScore({
              likes,
              comments,
              shares: shares + delta,
              sumOfRatings,
              totalRatings,
            });
            expectMonotonicNonDecreasing(after, before);
          },
        ),
      );
    });

    it('is non-decreasing when an additional 5-star rating is added (with engagement)', () => {
      // Same caveat as the effective_rating version: the strongest unconditional
      // monotonicity invariant on rating contribution is for newRating = 5.
      fc.assert(
        fc.property(
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 0, max: 1000}),
          fc.integer({min: 0, max: 1000}),
          ratingHistoryArb,
          (likes, comments, shares, {sumOfRatings, totalRatings}) => {
            const before = computeTrendingScore({
              likes,
              comments,
              shares,
              sumOfRatings,
              totalRatings,
            });
            const after = computeTrendingScore({
              likes,
              comments,
              shares,
              sumOfRatings: sumOfRatings + 5,
              totalRatings: totalRatings + 1,
            });
            expectMonotonicNonDecreasing(after, before);
          },
        ),
      );
    });
  });
});
