/**
 * Feature: cook-smart-website, Property 7: Recipe pagination
 * Validates: Requirements 2.5
 *
 * Property: For any list of recipes, pagination should correctly divide the results
 * into pages and maintain data integrity across page boundaries.
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
    { minLength: 1, maxLength: 5 }
  ),
  instructions: fc.array(fc.string({ minLength: 10, maxLength: 200 }), {
    minLength: 1,
    maxLength: 5,
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

// Helper function to paginate recipes
function paginateRecipes(
  recipes: Recipe[],
  page: number,
  pageSize: number
): { items: Recipe[]; total: number; hasMore: boolean; totalPages: number } {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = recipes.slice(startIndex, endIndex);
  const total = recipes.length;
  const totalPages = Math.ceil(total / pageSize);
  const hasMore = page < totalPages;

  return { items, total, hasMore, totalPages };
}

describe('Property 7: Recipe pagination', () => {
  it('should correctly divide recipes into pages', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 5, max: 20 }),
        (recipes, pageSize) => {
          const totalPages = Math.ceil(recipes.length / pageSize);

          // Collect all items from all pages
          const allPaginatedItems: Recipe[] = [];
          for (let page = 1; page <= totalPages; page++) {
            const result = paginateRecipes(recipes, page, pageSize);
            allPaginatedItems.push(...result.items);
          }

          // All original recipes should be present exactly once
          expect(allPaginatedItems.length).toBe(recipes.length);
          expect(allPaginatedItems.map((r) => r.id).sort()).toEqual(
            recipes.map((r) => r.id).sort()
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return correct page size except for last page', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 5, max: 15 }),
        (recipes, pageSize) => {
          const totalPages = Math.ceil(recipes.length / pageSize);

          for (let page = 1; page <= totalPages; page++) {
            const result = paginateRecipes(recipes, page, pageSize);

            if (page < totalPages) {
              // All pages except last should have full page size
              expect(result.items.length).toBe(pageSize);
            } else {
              // Last page should have remaining items
              const expectedLastPageSize = recipes.length % pageSize || pageSize;
              expect(result.items.length).toBe(expectedLastPageSize);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should correctly indicate hasMore flag', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 5, max: 15 }),
        (recipes, pageSize) => {
          const totalPages = Math.ceil(recipes.length / pageSize);

          for (let page = 1; page <= totalPages; page++) {
            const result = paginateRecipes(recipes, page, pageSize);

            if (page < totalPages) {
              expect(result.hasMore).toBe(true);
            } else {
              expect(result.hasMore).toBe(false);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return correct total count on all pages', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 5, maxLength: 30 }),
        fc.integer({ min: 5, max: 15 }),
        (recipes, pageSize) => {
          const totalPages = Math.ceil(recipes.length / pageSize);

          for (let page = 1; page <= totalPages; page++) {
            const result = paginateRecipes(recipes, page, pageSize);
            expect(result.total).toBe(recipes.length);
          }
        }
      ),
      { numRuns: 40 }
    );
  });

  it('should handle page numbers beyond total pages gracefully', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 5, maxLength: 30 }),
        fc.integer({ min: 5, max: 10 }),
        (recipes, pageSize) => {
          const totalPages = Math.ceil(recipes.length / pageSize);
          const beyondPage = totalPages + 5;

          const result = paginateRecipes(recipes, beyondPage, pageSize);

          // Should return empty items
          expect(result.items.length).toBe(0);
          expect(result.hasMore).toBe(false);
          expect(result.total).toBe(recipes.length);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should not have overlapping items between pages', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 20, maxLength: 50 }),
        fc.integer({ min: 5, max: 15 }),
        (recipes, pageSize) => {
          const totalPages = Math.ceil(recipes.length / pageSize);
          const seenIds = new Set<string>();

          for (let page = 1; page <= totalPages; page++) {
            const result = paginateRecipes(recipes, page, pageSize);

            result.items.forEach((recipe) => {
              // Each recipe ID should only appear once
              expect(seenIds.has(recipe.id)).toBe(false);
              seenIds.add(recipe.id);
            });
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain recipe order across pages', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 15, maxLength: 40 }),
        fc.integer({ min: 5, max: 12 }),
        (recipes, pageSize) => {
          const totalPages = Math.ceil(recipes.length / pageSize);
          const paginatedOrder: string[] = [];

          for (let page = 1; page <= totalPages; page++) {
            const result = paginateRecipes(recipes, page, pageSize);
            paginatedOrder.push(...result.items.map((r) => r.id));
          }

          // Order should match original
          expect(paginatedOrder).toEqual(recipes.map((r) => r.id));
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should calculate total pages correctly', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (recipes, pageSize) => {
          const result = paginateRecipes(recipes, 1, pageSize);
          const expectedTotalPages = Math.ceil(recipes.length / pageSize);

          expect(result.totalPages).toBe(expectedTotalPages);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle single page correctly when all items fit', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 1, maxLength: 10 }),
        (recipes) => {
          const pageSize = recipes.length + 5; // Larger than total items
          const result = paginateRecipes(recipes, 1, pageSize);

          expect(result.items.length).toBe(recipes.length);
          expect(result.hasMore).toBe(false);
          expect(result.totalPages).toBe(1);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle empty recipe list', () => {
    const result = paginateRecipes([], 1, 10);

    expect(result.items.length).toBe(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
    expect(result.totalPages).toBe(0);
  });
});

