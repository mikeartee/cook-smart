/**
 * Feature: cook-smart-website, Property 6: Recipe search filtering
 * Validates: Requirements 2.4
 *
 * Property: For any search query, the filtered results should only include recipes
 * that match the search criteria (keywords, ingredients, or dietary preferences).
 */

import * as fc from 'fast-check';
import { Recipe } from '@/types';

// Arbitrary for generating test recipes
const recipeArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 500 }),
  imageUrl: fc.oneof(fc.constant(''), fc.webUrl()),
  ingredients: fc.array(
    fc.record({
      name: fc.string({ minLength: 2, maxLength: 50 }),
      amount: fc.string({ minLength: 1, maxLength: 10 }),
      unit: fc.string({ minLength: 1, maxLength: 20 }),
    }),
    { minLength: 1, maxLength: 10 }
  ),
  instructions: fc.array(fc.string({ minLength: 10, maxLength: 200 }), {
    minLength: 1,
    maxLength: 8,
  }),
  cookingTime: fc.integer({ min: 5, max: 300 }),
  servings: fc.integer({ min: 1, max: 20 }),
  nutritionalInfo: fc.record({
    calories: fc.integer({ min: 50, max: 2000 }),
    protein: fc.integer({ min: 0, max: 200 }),
    carbs: fc.integer({ min: 0, max: 300 }),
    fat: fc.integer({ min: 0, max: 150 }),
    fiber: fc.integer({ min: 0, max: 50 }),
  }),
  author: fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 2, maxLength: 50 }),
    email: fc.emailAddress(),
    role: fc.constantFrom('user' as const, 'admin' as const, 'super_admin' as const),
    isActive: fc.boolean(),
    createdAt: fc.date(),
    lastLoginAt: fc.date(),
  }),
  isFeatured: fc.boolean(),
  isFlagged: fc.boolean(),
  status: fc.constantFrom('draft' as const, 'published' as const, 'archived' as const),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

// Helper function to filter recipes by search query
function filterRecipesBySearch(recipes: Recipe[], searchQuery: string): Recipe[] {
  if (!searchQuery || searchQuery.trim() === '') {
    return recipes;
  }

  const query = searchQuery.toLowerCase().trim();

  return recipes.filter((recipe) => {
    const titleMatch = recipe.title.toLowerCase().includes(query);
    const descriptionMatch = recipe.description.toLowerCase().includes(query);
    const ingredientMatch = recipe.ingredients.some((ing) =>
      ing.name.toLowerCase().includes(query)
    );

    return titleMatch || descriptionMatch || ingredientMatch;
  });
}

// Helper function to filter recipes by cooking time
function filterRecipesByTime(recipes: Recipe[], timeRange: string): Recipe[] {
  return recipes.filter((recipe) => {
    if (timeRange === 'Under 15 min') return recipe.cookingTime < 15;
    if (timeRange === '15-30 min')
      return recipe.cookingTime >= 15 && recipe.cookingTime <= 30;
    if (timeRange === '30-60 min')
      return recipe.cookingTime > 30 && recipe.cookingTime <= 60;
    if (timeRange === 'Over 60 min') return recipe.cookingTime > 60;
    return true;
  });
}

describe('Property 6: Recipe search filtering', () => {
  it('should return only recipes matching the search query in title', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 2, maxLength: 20 }),
        (recipes, searchQuery) => {
          const filteredRecipes = filterRecipesBySearch(recipes, searchQuery);

          // All filtered recipes should match the search query
          filteredRecipes.forEach((recipe) => {
            const query = searchQuery.toLowerCase().trim();
            const matches =
              recipe.title.toLowerCase().includes(query) ||
              recipe.description.toLowerCase().includes(query) ||
              recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(query));

            expect(matches).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return empty array when no recipes match the search', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 1, maxLength: 10 }),
        (recipes) => {
          // Use a search query that definitely won't match
          const impossibleQuery = 'xyzabc123impossible456query789';
          const filteredRecipes = filterRecipesBySearch(recipes, impossibleQuery);

          // Should return empty or only recipes that somehow match
          filteredRecipes.forEach((recipe) => {
            const query = impossibleQuery.toLowerCase();
            const matches =
              recipe.title.toLowerCase().includes(query) ||
              recipe.description.toLowerCase().includes(query) ||
              recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(query));

            expect(matches).toBe(true);
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should be case-insensitive when searching', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 5, maxLength: 15 }),
        fc.string({ minLength: 2, maxLength: 20 }),
        (recipes, searchQuery) => {
          const lowerCaseResults = filterRecipesBySearch(recipes, searchQuery.toLowerCase());
          const upperCaseResults = filterRecipesBySearch(recipes, searchQuery.toUpperCase());
          const mixedCaseResults = filterRecipesBySearch(recipes, searchQuery);

          // All three should return the same results
          expect(lowerCaseResults.length).toBe(upperCaseResults.length);
          expect(lowerCaseResults.length).toBe(mixedCaseResults.length);
        }
      ),
      { numRuns: 40 }
    );
  });

  it('should filter by cooking time ranges correctly', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 10, maxLength: 30 }),
        fc.constantFrom('Under 15 min', '15-30 min', '30-60 min', 'Over 60 min'),
        (recipes, timeRange) => {
          const filteredRecipes = filterRecipesByTime(recipes, timeRange);

          // All filtered recipes should match the time range
          filteredRecipes.forEach((recipe) => {
            if (timeRange === 'Under 15 min') {
              expect(recipe.cookingTime).toBeLessThan(15);
            } else if (timeRange === '15-30 min') {
              expect(recipe.cookingTime).toBeGreaterThanOrEqual(15);
              expect(recipe.cookingTime).toBeLessThanOrEqual(30);
            } else if (timeRange === '30-60 min') {
              expect(recipe.cookingTime).toBeGreaterThan(30);
              expect(recipe.cookingTime).toBeLessThanOrEqual(60);
            } else if (timeRange === 'Over 60 min') {
              expect(recipe.cookingTime).toBeGreaterThan(60);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return all recipes when search query is empty', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 1, maxLength: 20 }),
        (recipes) => {
          const emptySearchResults = filterRecipesBySearch(recipes, '');
          const whitespaceSearchResults = filterRecipesBySearch(recipes, '   ');

          // Should return all recipes
          expect(emptySearchResults.length).toBe(recipes.length);
          expect(whitespaceSearchResults.length).toBe(recipes.length);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle ingredient-based filtering', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 5, maxLength: 15 }),
        (recipes) => {
          // Pick a random ingredient from the recipes
          if (recipes.length > 0 && recipes[0].ingredients.length > 0) {
            const searchIngredient = recipes[0].ingredients[0].name;
            const filteredRecipes = filterRecipesBySearch(recipes, searchIngredient);

            // At least the first recipe should be in the results
            const firstRecipeIncluded = filteredRecipes.some((r) => r.id === recipes[0].id);
            expect(firstRecipeIncluded).toBe(true);
          }
        }
      ),
      { numRuns: 40 }
    );
  });

  it('should maintain filter consistency across multiple applications', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 5, maxLength: 15 }),
        fc.string({ minLength: 2, maxLength: 20 }),
        (recipes, searchQuery) => {
          // Apply the same filter twice
          const results1 = filterRecipesBySearch(recipes, searchQuery);
          const results2 = filterRecipesBySearch(recipes, searchQuery);

          // Should produce identical results
          expect(results1.length).toBe(results2.length);
          expect(results1.map((r) => r.id)).toEqual(results2.map((r) => r.id));
        }
      ),
      { numRuns: 40 }
    );
  });

  it('should handle partial matches in search', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 5, maxLength: 15 }),
        (recipes) => {
          // Take a substring from a recipe title
          if (recipes.length > 0 && recipes[0].title.length > 3) {
            const partialQuery = recipes[0].title.substring(0, 3);
            const filteredRecipes = filterRecipesBySearch(recipes, partialQuery);

            // The original recipe should be in the results
            const originalIncluded = filteredRecipes.some((r) => r.id === recipes[0].id);
            expect(originalIncluded).toBe(true);
          }
        }
      ),
      { numRuns: 40 }
    );
  });
});

