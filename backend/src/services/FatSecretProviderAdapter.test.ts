/**
 * Unit tests for FatSecretProviderAdapter.isAvailable().
 *
 * Pins the post-#24 contract: when FATSECRET_CLIENT_ID or
 * FATSECRET_CLIENT_SECRET are missing, isAvailable() returns false WITHOUT
 * making an HTTP call. That lets the RecipeProviderService skip to its
 * fallback (TheMealDB) without a wasted network roundtrip.
 *
 * Per docs/codebase-assessment.md F-EB-2: FatSecret is the sole registered
 * recipe provider today; #24 wires up TheMealDB alongside it.
 */

import FatSecretService from './FatSecretService';

// We only mock the real network surface (FatSecretService.searchRecipes).
// FatSecretService uses isConfigured() to gate everything; the adapter
// shouldn't call into the service at all when env is unset.
jest.mock('./FatSecretService', () => ({
  __esModule: true,
  default: {
    searchRecipes: jest.fn(),
  },
}));

// The adapter pulls in RecipeMatchingService, which is irrelevant to
// isAvailable(). Stub to keep imports cheap.
jest.mock('./RecipeMatchingService', () => ({
  RecipeMatchingService: {
    formatRecipesWithMatching: jest.fn((recipes: unknown) => recipes),
  },
}));

const fatSecretMock = FatSecretService as jest.Mocked<typeof FatSecretService>;

// Import after mocks.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FatSecretAdapter = require('./FatSecretProviderAdapter').default as {
  isAvailable: () => Promise<boolean>;
};

describe('FatSecretProviderAdapter.isAvailable() (issue #24)', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {...ORIGINAL_ENV};
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns false without an HTTP call when FATSECRET_CLIENT_ID is missing', async () => {
    delete process.env.FATSECRET_CLIENT_ID;
    process.env.FATSECRET_CLIENT_SECRET = 'present';

    const available = await FatSecretAdapter.isAvailable();

    expect(available).toBe(false);
    expect(fatSecretMock.searchRecipes).not.toHaveBeenCalled();
  });

  it('returns false without an HTTP call when FATSECRET_CLIENT_SECRET is missing', async () => {
    process.env.FATSECRET_CLIENT_ID = 'present';
    delete process.env.FATSECRET_CLIENT_SECRET;

    const available = await FatSecretAdapter.isAvailable();

    expect(available).toBe(false);
    expect(fatSecretMock.searchRecipes).not.toHaveBeenCalled();
  });

  it('returns false without an HTTP call when both env vars are empty strings', async () => {
    process.env.FATSECRET_CLIENT_ID = '';
    process.env.FATSECRET_CLIENT_SECRET = '';

    const available = await FatSecretAdapter.isAvailable();

    expect(available).toBe(false);
    expect(fatSecretMock.searchRecipes).not.toHaveBeenCalled();
  });

  it('probes the upstream service when both env vars are present (regression guard)', async () => {
    process.env.FATSECRET_CLIENT_ID = 'present';
    process.env.FATSECRET_CLIENT_SECRET = 'present';
    fatSecretMock.searchRecipes.mockResolvedValueOnce([
      {recipe_id: 'r-1', recipe_name: 'Test'},
    ] as unknown[]);

    const available = await FatSecretAdapter.isAvailable();

    expect(available).toBe(true);
    expect(fatSecretMock.searchRecipes).toHaveBeenCalledTimes(1);
  });
});
