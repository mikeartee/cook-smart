/**
 * Route-level tests for the POST /interaction endpoint.
 *
 * Verifies the validation contract introduced in slice #16 of PRD #14:
 * - `interactionType: 'rate'` is rejected with HTTP 400 + a redirect-message body
 *   pointing callers at the canonical rating endpoint.
 * - Unknown `interactionType` values are rejected with HTTP 400.
 * - Valid `interactionType` values (`view` / `save` / `share` / `cook`) are
 *   forwarded to RecipeCacheService.trackInteraction and return 200.
 * - Missing required fields (`recipeId` / `interactionType`) return HTTP 400.
 *
 * This is the first route-level test in the backend. It uses supertest (already
 * a backend dev dep) against an Express app mounted just for this suite, with
 * the auth middleware and RecipeCacheService mocked. Future route tests can
 * copy this shape.
 */

import express from 'express';
import request from 'supertest';

// Mock auth middleware to a pass-through that injects a stable test user.
// Note: AuthRequest is a type-only export, no runtime value needed in the mock.
jest.mock('../middleware/auth', () => ({
  authenticateToken: (
    req: {user?: {id: string}},
    _res: unknown,
    next: () => void,
  ) => {
    req.user = {id: 'test-user-id'};
    next();
  },
}));

// Mock RecipeCacheService.trackInteraction so the route test isn't coupled to
// the service's database side-effects. The slice-#5 unit tests cover that path.
const trackInteractionMock = jest.fn();
jest.mock('../services/RecipeCacheService', () => ({
  __esModule: true,
  default: {
    trackInteraction: (...args: unknown[]) => trackInteractionMock(...args),
  },
}));

// The route module imports several other services we don't exercise; stub them
// so module evaluation doesn't pull in real network/database dependencies.
jest.mock('../services/FatSecretProviderAdapter', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('../services/RecipeProviderService', () => ({
  RecipeProviderService: class {},
}));
jest.mock('../services/DietaryAwareRecipeService', () => ({
  DietaryAwareRecipeService: class {},
}));
jest.mock('../services/RecipeScalingService', () => ({
  RecipeScalingService: class {},
}));
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {query: jest.fn()},
}));

// Import after mocks are registered.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const trendingRouter = require('./trendingRecipes').default;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/', trendingRouter);
  return app;
}

beforeEach(() => {
  trackInteractionMock.mockReset();
});

describe('POST /interaction', () => {
  describe('rejects deprecated and unknown interaction types', () => {
    it("returns 400 + redirect message when interactionType is 'rate'", async () => {
      const res = await request(makeApp())
        .post('/interaction')
        .send({recipeId: 'recipe-abc', interactionType: 'rate', rating: 5});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("'rate' is no longer supported");
      expect(res.body.error).toContain('/api/v1/recipe-enhancements/ratings');
      expect(trackInteractionMock).not.toHaveBeenCalled();
    });

    it('returns 400 when interactionType is unknown', async () => {
      const res = await request(makeApp())
        .post('/interaction')
        .send({recipeId: 'recipe-abc', interactionType: 'wave-at-recipe'});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('interactionType must be one of');
      expect(trackInteractionMock).not.toHaveBeenCalled();
    });

    it('returns 400 when recipeId is missing', async () => {
      const res = await request(makeApp())
        .post('/interaction')
        .send({interactionType: 'view'});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required fields');
      expect(trackInteractionMock).not.toHaveBeenCalled();
    });

    it('returns 400 when interactionType is missing', async () => {
      const res = await request(makeApp())
        .post('/interaction')
        .send({recipeId: 'recipe-abc'});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required fields');
      expect(trackInteractionMock).not.toHaveBeenCalled();
    });
  });

  describe('forwards valid interaction types to RecipeCacheService', () => {
    it.each(['view', 'save', 'share', 'cook'])(
      'returns 200 and forwards interactionType=%s',
      async interactionType => {
        trackInteractionMock.mockResolvedValueOnce(undefined);

        const res = await request(makeApp())
          .post('/interaction')
          .send({recipeId: 'recipe-abc', interactionType});

        expect(res.status).toBe(200);
        expect(res.body).toEqual({success: true});
        expect(trackInteractionMock).toHaveBeenCalledWith(
          'recipe-abc',
          interactionType,
          'test-user-id',
          undefined,
        );
      },
    );
  });
});
