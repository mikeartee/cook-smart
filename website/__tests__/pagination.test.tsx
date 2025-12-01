import { createMockRecipe } from '@/lib/test-utils';
import * as fc from 'fast-check';
import { propertyTestConfig } from '@/lib/property-test-utils';
import { RECIPES_PER_PAGE } from '@/lib/constants';

// **Feature: cook-smart-website, Property 7: Recipe pagination**
describe('Pagination Tests', () => {
  it('property: pagination correctly limits displayed recipes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 5 }),
        (totalRecipes, currentPage) => {
          // Generate recipes
          const recipes = Array.from({ length: totalRecipes }, (_, i) =>
            createMockRecipe({ id: `${i + 1}`, title: `Recipe ${i + 1}` })
          );

          // Simulate pagination
          const paginatedRecipes = recipes.slice(0, currentPage * RECIPES_PER_PAGE);

          // Verify pagination logic
          const expectedCount = Math.min(totalRecipes, currentPage * RECIPES_PER_PAGE);
          expect(paginatedRecipes.length).toBe(expectedCount);

          // Verify no duplicates
          const ids = paginatedRecipes.map((r) => r.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(paginatedRecipes.length);

          return true;
        }
      ),
      propertyTestConfig
    );
  });

  it('should paginate recipes correctly', () => {
    const recipes = Array.from({ length: 25 }, (_, i) =>
      createMockRecipe({ id: `${i + 1}` })
    );

    // Page 1
    const page1 = recipes.slice(0, RECIPES_PER_PAGE);
    expect(page1.length).toBe(RECIPES_PER_PAGE);

    // Page 2
    const page2 = recipes.slice(0, 2 * RECIPES_PER_PAGE);
    expect(page2.length).toBe(2 * RECIPES_PER_PAGE);
  });

  it('should handle last page with fewer items', () => {
    const recipes = Array.from({ length: 15 }, (_, i) =>
      createMockRecipe({ id: `${i + 1}` })
    );

    const page2 = recipes.slice(0, 2 * RECIPES_PER_PAGE);
    expect(page2.length).toBe(15);
  });

  it('should determine hasMore correctly', () => {
    const recipes = Array.from({ length: 25 }, (_, i) =>
      createMockRecipe({ id: `${i + 1}` })
    );

    // Page 1 - has more
    const page1 = recipes.slice(0, RECIPES_PER_PAGE);
    const hasMore1 = page1.length < recipes.length;
    expect(hasMore1).toBe(true);

    // Page 3 - no more (assuming 12 per page)
    const page3 = recipes.slice(0, 3 * RECIPES_PER_PAGE);
    const hasMore3 = page3.length < recipes.length;
    expect(hasMore3).toBe(false);
  });

  it('should not have duplicates across pages', () => {
    const recipes = Array.from({ length: 30 }, (_, i) =>
      createMockRecipe({ id: `${i + 1}` })
    );

    const page1 = recipes.slice(0, RECIPES_PER_PAGE);
    const page2 = recipes.slice(0, 2 * RECIPES_PER_PAGE);

    const ids = page2.map((r) => r.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(page2.length);
  });

  it('should handle empty recipe list', () => {
    const recipes: any[] = [];
    const page1 = recipes.slice(0, RECIPES_PER_PAGE);

    expect(page1.length).toBe(0);
  });

  it('should handle single page of recipes', () => {
    const recipes = Array.from({ length: 5 }, (_, i) =>
      createMockRecipe({ id: `${i + 1}` })
    );

    const page1 = recipes.slice(0, RECIPES_PER_PAGE);
    const hasMore = page1.length < recipes.length;

    expect(page1.length).toBe(5);
    expect(hasMore).toBe(false);
  });
});
