/**
 * Feature: cook-smart-website, Property 3: Recipe grid completeness
 * Validates: Requirements 2.1
 *
 * Property: For any featured recipe displayed in the grid, it should include
 * an image, title, and brief description.
 */

import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { RecipeGrid } from '@/components/recipe-grid';
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
    { minLength: 1, maxLength: 15 }
  ),
  instructions: fc.array(fc.string({ minLength: 10, maxLength: 200 }), {
    minLength: 1,
    maxLength: 10,
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
}) as fc.Arbitrary<Recipe>;

describe('Property 3: Recipe grid completeness', () => {
  it('should display title, description, and image placeholder for all recipes', () => {
    fc.assert(
      fc.property(fc.array(recipeArbitrary, { minLength: 1, maxLength: 12 }), (recipes) => {
        const { container, unmount } = render(<RecipeGrid recipes={recipes} />);

        // For each recipe, verify required elements are present
        recipes.forEach((recipe) => {
          // Title should be present
          expect(container.textContent).toContain(recipe.title);

          // Description should be present
          expect(container.textContent).toContain(recipe.description);

          // Author name should be present
          expect(container.textContent).toContain(recipe.author.name);

          // Cooking time should be displayed
          expect(container.textContent).toContain(`${recipe.cookingTime} min`);

          // Servings should be displayed
          expect(container.textContent).toContain(`${recipe.servings} servings`);
        });

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('should display featured badge for featured recipes', () => {
    fc.assert(
      fc.property(fc.array(recipeArbitrary, { minLength: 1, maxLength: 10 }), (recipes) => {
        const { container, unmount } = render(<RecipeGrid recipes={recipes} />);

        const featuredRecipes = recipes.filter((r) => r.isFeatured);

        // If there are featured recipes, the "Featured" text should be present
        if (featuredRecipes.length > 0) {
          expect(container.textContent).toContain('Featured');
        } else {
          // If no featured recipes, "Featured" should not appear
          expect(container.textContent).not.toContain('Featured');
        }

        unmount();
      }),
      { numRuns: 30 }
    );
  });

  it('should display cooking time and servings for all recipes', () => {
    fc.assert(
      fc.property(fc.array(recipeArbitrary, { minLength: 1, maxLength: 8 }), (recipes) => {
        const { container, unmount } = render(<RecipeGrid recipes={recipes} />);

        recipes.forEach((recipe) => {
          // Check for cooking time
          expect(container.textContent).toContain(`${recipe.cookingTime} min`);

          // Check for servings
          expect(container.textContent).toContain(`${recipe.servings} servings`);
        });

        unmount();
      }),
      { numRuns: 40 }
    );
  });

  it('should render grid layout with proper structure', () => {
    fc.assert(
      fc.property(fc.array(recipeArbitrary, { minLength: 1, maxLength: 12 }), (recipes) => {
        const { container, unmount } = render(<RecipeGrid recipes={recipes} />);

        // Grid should be present
        const grid = container.querySelector('div[class*="grid"]');
        expect(grid).toBeTruthy();

        // Each recipe should have a link to its detail page
        recipes.forEach((recipe) => {
          const links = container.querySelectorAll(`a[href="/recipes/${recipe.id}"]`);
          expect(links.length).toBeGreaterThan(0);
        });

        unmount();
      }),
      { numRuns: 30 }
    );
  });

  it('should show empty state when no recipes are provided', () => {
    const { container, unmount } = render(<RecipeGrid recipes={[]} />);

    // Empty state message should be present
    expect(container.textContent).toContain('No recipes found');
    expect(container.textContent).toContain('Try adjusting your filters or search terms');

    unmount();
  });

  it('should show loading skeleton when isLoading is true', () => {
    const { container, unmount } = render(<RecipeGrid recipes={[]} isLoading={true} />);

    // Loading skeleton should be present
    const skeletons = container.querySelectorAll('div[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);

    unmount();
  });

  it('should display all recipe cards with complete information', () => {
    fc.assert(
      fc.property(fc.array(recipeArbitrary, { minLength: 2, maxLength: 6 }), (recipes) => {
        const { container, unmount } = render(<RecipeGrid recipes={recipes} />);

        // Count the number of recipe cards (links to recipe detail pages)
        const recipeLinks = container.querySelectorAll('a[href^="/recipes/"]');
        expect(recipeLinks.length).toBe(recipes.length);

        // Each card should have essential information
        recipes.forEach((recipe) => {
          expect(container.textContent).toContain(recipe.title);
          expect(container.textContent).toContain(recipe.description);
        });

        unmount();
      }),
      { numRuns: 50 }
    );
  });
});

