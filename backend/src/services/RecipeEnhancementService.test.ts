/**
 * Backend unit tests for RecipeEnhancementService.rateRecipe and the
 * SocialService.updateTrendingScore orchestration it triggers.
 *
 * These tests use mocked pool.query — they verify the orchestration shape
 * (which queries fire, in what order, with what arguments) without standing
 * up a real database. The arithmetic itself is owned by
 * TrendingScoreCalculator and tested separately under property-based testing.
 */

import {TRENDING_DEFAULTS} from './TrendingScoreCalculator';

// Mock the database module so RecipeEnhancementService and SocialService share
// the same mocked pool. Both modules import `pool from '../config/database'`.
const queryMock = jest.fn();
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {query: (...args: unknown[]) => queryMock(...args)},
}));

// Import after the mock is registered.
import {RecipeEnhancementService} from './RecipeEnhancementService';

beforeEach(() => {
  queryMock.mockReset();
});

/**
 * Default mock for the chain of queries fired by rateRecipe → updateTrendingScore.
 *
 * Order (after the initial recipe_ratings upsert):
 *   1. recipe_ratings UPSERT (returns the new row)
 *   2. SELECT COUNT(*) FROM recipe_likes
 *   3. SELECT COUNT(*) FROM recipe_comments
 *   4. SELECT COUNT(*) FROM recipe_shares
 *   5. SELECT SUM/COUNT/AVG FROM recipe_ratings
 *   6. INSERT/UPDATE trending_recipes
 *   7. UPDATE recipe_cache
 */
function mockHappyPath(opts?: {
  likes?: number;
  comments?: number;
  shares?: number;
  sumOfRatings?: number;
  totalRatings?: number;
  ratingAverage?: number;
}) {
  const {
    likes = 0,
    comments = 0,
    shares = 0,
    sumOfRatings = 5,
    totalRatings = 1,
    ratingAverage = 5.0,
  } = opts ?? {};

  queryMock
    .mockResolvedValueOnce({rows: [{id: 1, rating: 5}]}) // 1: rating upsert
    .mockResolvedValueOnce({rows: [{count: String(likes)}]}) // 2: likes
    .mockResolvedValueOnce({rows: [{count: String(comments)}]}) // 3: comments
    .mockResolvedValueOnce({rows: [{count: String(shares)}]}) // 4: shares
    .mockResolvedValueOnce({
      rows: [
        {
          sum_of_ratings: sumOfRatings,
          total_ratings: totalRatings,
          rating_average: ratingAverage,
        },
      ],
    }) // 5: rating aggregates
    .mockResolvedValueOnce({rows: [{}]}) // 6: trending_recipes upsert
    .mockResolvedValueOnce({rows: [{}]}); // 7: recipe_cache update
}

describe('RecipeEnhancementService.rateRecipe', () => {
  it('upserts the rating into recipe_ratings (new rating)', async () => {
    mockHappyPath();

    await RecipeEnhancementService.rateRecipe(
      'user-123',
      'recipe-abc',
      'api',
      5,
      'Great recipe',
    );

    const ratingUpsertCall = queryMock.mock.calls[0];
    expect(ratingUpsertCall![0]).toContain('INSERT INTO recipe_ratings');
    expect(ratingUpsertCall![0]).toContain(
      'ON CONFLICT (user_id, recipe_id, recipe_type)',
    );
    expect(ratingUpsertCall![1]).toEqual([
      'user-123',
      'recipe-abc',
      'api',
      5,
      'Great recipe',
    ]);
  });

  it('upserts the rating with no review when review is omitted', async () => {
    mockHappyPath();

    await RecipeEnhancementService.rateRecipe(
      'user-123',
      'recipe-abc',
      'api',
      4,
    );

    const ratingUpsertCall = queryMock.mock.calls[0];
    expect(ratingUpsertCall![1]).toEqual([
      'user-123',
      'recipe-abc',
      'api',
      4,
      undefined,
    ]);
  });

  it('triggers updateTrendingScore (reads engagement counts and rating aggregates)', async () => {
    mockHappyPath({
      likes: 3,
      comments: 2,
      shares: 1,
      sumOfRatings: 20,
      totalRatings: 4,
      ratingAverage: 5.0,
    });

    await RecipeEnhancementService.rateRecipe(
      'user-123',
      'recipe-abc',
      'api',
      5,
    );

    // Calls 2-5 are the four reads that updateTrendingScore performs in
    // parallel via Promise.all. Order within Promise.all is not guaranteed
    // by the spec, but pg-pool resolves them in registration order in
    // practice. Match by SQL fragment instead of position.
    const allSql = queryMock.mock.calls.map(c => c[0] as string);
    expect(allSql.some(s => s.includes('FROM recipe_likes'))).toBe(true);
    expect(allSql.some(s => s.includes('FROM recipe_comments'))).toBe(true);
    expect(allSql.some(s => s.includes('FROM recipe_shares'))).toBe(true);
    expect(
      allSql.some(s => s.includes('FROM recipe_ratings') && s.includes('SUM')),
    ).toBe(true);
  });

  it('writes the recomputed score and aggregates to trending_recipes', async () => {
    mockHappyPath({
      likes: 10,
      comments: 5,
      shares: 2,
      sumOfRatings: 20,
      totalRatings: 4,
      ratingAverage: 5.0,
    });

    await RecipeEnhancementService.rateRecipe(
      'user-123',
      'recipe-abc',
      'api',
      5,
    );

    const trendingWrite = queryMock.mock.calls.find(
      c => typeof c[0] === 'string' && c[0].includes('trending_recipes'),
    );
    expect(trendingWrite).toBeDefined();
    const sql = trendingWrite![0] as string;
    expect(sql).toContain('INSERT INTO trending_recipes');
    expect(sql).toContain('ON CONFLICT (recipe_id)');
    // Args: recipeId, score, likes, comments, shares, ratingAverage, totalRatings.
    const args = trendingWrite![1] as unknown[];
    expect(args[0]).toBe('recipe-abc');
    expect(args[2]).toBe(10); // likes
    expect(args[3]).toBe(5); // comments
    expect(args[4]).toBe(2); // shares
    expect(args[5]).toBe(5.0); // rating_average
    expect(args[6]).toBe(4); // rating_count

    // Score should be likes×1 + comments×2 + shares×3 + effectiveRating × W.
    // effective = (5×4 + 20)/(5+4) = 40/9 ≈ 4.444
    // score = 10 + 10 + 6 + 4.444 × 0.5 ≈ 28.222
    const expectedEffective =
      (TRENDING_DEFAULTS.priorWeight * TRENDING_DEFAULTS.globalMean + 20) /
      (TRENDING_DEFAULTS.priorWeight + 4);
    const expectedScore =
      10 + 10 + 6 + expectedEffective * TRENDING_DEFAULTS.ratingWeight;
    expect(args[1]).toBeCloseTo(expectedScore, 5);
  });

  it('writes the rating aggregates to recipe_cache', async () => {
    mockHappyPath({
      sumOfRatings: 14,
      totalRatings: 3,
      ratingAverage: 4.67,
    });

    await RecipeEnhancementService.rateRecipe(
      'user-123',
      'recipe-abc',
      'api',
      4,
    );

    const cacheWrite = queryMock.mock.calls.find(
      c =>
        typeof c[0] === 'string' &&
        c[0].includes('UPDATE recipe_cache') &&
        c[0].includes('rating_average') &&
        c[0].includes('rating_count'),
    );
    expect(cacheWrite).toBeDefined();
    const args = cacheWrite![1] as unknown[];
    expect(args[0]).toBe('recipe-abc');
    expect(args[1]).toBe(4.67);
    expect(args[2]).toBe(3);
  });

  it('uses recipe_type when reading rating aggregates', async () => {
    mockHappyPath();

    await RecipeEnhancementService.rateRecipe(
      'user-123',
      'recipe-xyz',
      'user',
      5,
    );

    const aggregatesQuery = queryMock.mock.calls.find(
      c =>
        typeof c[0] === 'string' &&
        c[0].includes('FROM recipe_ratings') &&
        c[0].includes('SUM'),
    );
    expect(aggregatesQuery).toBeDefined();
    expect(aggregatesQuery![1]).toEqual(['recipe-xyz', 'user']);
  });

  it('returns the upserted rating row', async () => {
    mockHappyPath();

    const result = await RecipeEnhancementService.rateRecipe(
      'user-123',
      'recipe-abc',
      'api',
      5,
    );

    expect(result).toEqual({id: 1, rating: 5});
  });
});
