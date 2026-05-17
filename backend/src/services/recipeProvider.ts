/**
 * Shared RecipeProviderService singleton.
 *
 * Resolves the duplication flagged in [F-OA-7](docs/codebase-assessment.md#f-oa-7-recipeproviderservice-is-an-orchestrator-wrapping-a-single-provider):
 * the same `new RecipeProviderService([FatSecretAdapter, TheMealDBAdapter])`
 * was constructed once in `routes/recipes.ts` and three times inside route
 * handlers in `routes/trendingRecipes.ts`. Both routers now import this
 * single instance.
 *
 * Provider chain (issue #24): FatSecret primary, TheMealDB fallback.
 * `FatSecretAdapter.isAvailable()` short-circuits to `false` when its env
 * vars are absent, so the orchestrator falls through to TheMealDB without
 * an HTTP roundtrip.
 */

import FatSecretAdapter from './FatSecretProviderAdapter';
import TheMealDBAdapter from './TheMealDBService';
import {RecipeProviderService} from './RecipeProviderService';

const recipeProviderService = new RecipeProviderService([
  FatSecretAdapter, // Primary: FatSecret Premier
  TheMealDBAdapter, // Fallback: TheMealDB unlimited-free tier
]);

export default recipeProviderService;
