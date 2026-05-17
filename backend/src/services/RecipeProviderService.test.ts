/**
 * Integration-style test for RecipeProviderService.searchByIngredients.
 *
 * Pins the post-#24 behaviour: when the primary provider's isAvailable()
 * returns false, the orchestrator falls through to a registered fallback
 * provider and returns the fallback's recipes.
 *
 * This test uses two in-memory IRecipeProvider stubs rather than mocking
 * the real FatSecretAdapter / TheMealDBService — the orchestrator's
 * fallback contract is the unit under test, not the upstream services.
 */

import {
  IRecipeProvider,
  Recipe,
  RecipeDetails,
} from '../interfaces/IRecipeProvider';

// The orchestrator pulls in RecipeCacheModel and APIUsageLogModel for
// caching and rate-limit logging. Stub both to no-ops so the test isn't
// coupled to the database.
jest.mock('../models/RecipeCache', () => ({
  RecipeCacheModel: {
    cacheRecipe: jest.fn(),
    cacheSearch: jest.fn(),
    getCachedRecipe: jest.fn(),
    getCachedSearch: jest.fn(),
    getCacheStats: jest.fn(),
  },
}));
jest.mock('../models/APIUsageLog', () => ({
  APIUsageLogModel: {
    logAPICall: jest.fn(),
    checkRateLimitWarning: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {RecipeProviderService} = require('./RecipeProviderService') as {
  RecipeProviderService: new (providers: IRecipeProvider[]) => {
    searchByIngredients: (
      ingredients: string[],
      limit: number,
      options?: Record<string, unknown>,
    ) => Promise<Recipe[]>;
    getLastUsedProvider: () => string;
  };
};

class StubProvider implements IRecipeProvider {
  constructor(
    public readonly name: string,
    public available: boolean,
    public recipes: Recipe[],
  ) {}

  searchByIngredients = jest.fn(async (): Promise<Recipe[]> => this.recipes);
  getRecipeDetails = jest.fn(
    async (id: string): Promise<RecipeDetails> => ({
      id,
      title: 'unused',
      image: '',
      servings: 0,
      readyInMinutes: 0,
      sourceUrl: '',
      summary: '',
      ingredients: [],
      instructions: '',
      cuisines: [],
      dishTypes: [],
      diets: [],
    }),
  );
  isAvailable = jest.fn(async (): Promise<boolean> => this.available);
  getProviderName = (): string => this.name;
}

function makeRecipe(id: string, provider: string): Recipe {
  return {
    id,
    title: `Recipe ${id}`,
    image: '',
    servings: 1,
    readyInMinutes: 10,
    sourceUrl: '',
    summary: '',
    ingredients: [],
    instructions: '',
    cuisines: [],
    dishTypes: [],
    diets: [],
    provider,
  };
}

describe('RecipeProviderService fallback chain (issue #24)', () => {
  it('returns fallback results when the primary provider is unavailable', async () => {
    const primary = new StubProvider('Primary', false, []);
    const fallback = new StubProvider('Fallback', true, [
      makeRecipe('fb-1', 'fallback'),
      makeRecipe('fb-2', 'fallback'),
    ]);

    const orchestrator = new RecipeProviderService([primary, fallback]);
    const results = await orchestrator.searchByIngredients(
      ['chicken', 'rice'],
      10,
    );

    // Primary's search must NOT have been called (skipped via isAvailable).
    expect(primary.searchByIngredients).not.toHaveBeenCalled();
    // Fallback's search must have been called.
    expect(fallback.searchByIngredients).toHaveBeenCalledTimes(1);
    expect(results.map(r => r.id)).toEqual(['fb-1', 'fb-2']);
  });

  it('returns primary results when the primary is available (regression guard)', async () => {
    const primary = new StubProvider('Primary', true, [
      makeRecipe('p-1', 'primary'),
    ]);
    const fallback = new StubProvider('Fallback', true, [
      makeRecipe('fb-1', 'fallback'),
    ]);

    const orchestrator = new RecipeProviderService([primary, fallback]);
    const results = await orchestrator.searchByIngredients(['chicken'], 10);

    expect(primary.searchByIngredients).toHaveBeenCalledTimes(1);
    expect(fallback.searchByIngredients).not.toHaveBeenCalled();
    expect(results.map(r => r.id)).toEqual(['p-1']);
  });
});
