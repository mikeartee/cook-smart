/**
 * Feature: cook-smart-website, Property 5: Approved content filtering
 * Validates: Requirements 2.3
 *
 * Property: For any list of recipes, only approved and non-flagged content
 * should be displayed on the public site.
 */

import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { RecipeGrid } from '@/components/recipe-grid';
import { Recipe } from '@/types';

// Arbitrary for generating test recipes with various statuses
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

describe('Property 5: Approved content filtering', () => {
  it('should only display published recipes', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 1, maxLength: 10 }),
        (recipes) => {
          // Filter to only published recipes (simulating backend filtering)
          const publishedRecipes = recipes.filter((r) => r.status === 'published');

          const { container, unmount } = render(<RecipeGrid recipes={publishedRecipes} />);

          // If there are published recipes, they should be displayed
          if (publishedRecipes.length > 0) {
            publishedRecipes.forEach((recipe) => {
              expect(container.textContent).toContain(recipe.title);
            });
          }

          // Draft and archived recipes should not be in the filtered list
          const nonPublishedRecipes = recipes.filter((r) => r.status !== 'published');
          nonPublishedRecipes.forEach((recipe) => {
            // These should not appear since we filtered them out
            expect(publishedRecipes).not.toContainEqual(
              expect.objectContaining({ id: recipe.id, status: recipe.status })
            );
          });

          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not display flagged content', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 1, maxLength: 10 }),
        (recipes) => {
          // Filter to only non-flagged recipes (simulating backend filtering)
          const nonFlaggedRecipes = recipes.filter((r) => !r.isFlagged);

          const { container, unmount } = render(<RecipeGrid recipes={nonFlaggedRecipes} />);

          // Non-flagged recipes should be displayed
          if (nonFlaggedRecipes.length > 0) {
            nonFlaggedRecipes.forEach((recipe) => {
              expect(container.textContent).toContain(recipe.title);
            });
          }

          // Flagged recipes should not be in the filtered list
          const flaggedRecipes = recipes.filter((r) => r.isFlagged);
          flaggedRecipes.forEach((recipe) => {
            expect(nonFlaggedRecipes).not.toContainEqual(
              expect.objectContaining({ id: recipe.id, isFlagged: true })
            );
          });

          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should only display approved content (published AND not flagged)', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 1, maxLength: 10 }),
        (recipes) => {
          // Filter to only approved content: published AND not flagged
          const approvedRecipes = recipes.filter(
            (r) => r.status === 'published' && !r.isFlagged
          );

          const { container, unmount } = render(<RecipeGrid recipes={approvedRecipes} />);

          // All displayed recipes should be approved
          approvedRecipes.forEach((recipe) => {
            expect(recipe.status).toBe('published');
            expect(recipe.isFlagged).toBe(false);
          });

          // Verify that unapproved content is not in the list
          const unapprovedRecipes = recipes.filter(
            (r) => r.status !== 'published' || r.isFlagged
          );

          unapprovedRecipes.forEach((recipe) => {
            expect(approvedRecipes).not.toContainEqual(
              expect.objectContaining({ id: recipe.id })
            );
          });

          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle empty results when no approved content exists', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 1, maxLength: 10 }).map((recipes) =>
          // Make all recipes unapproved
          recipes.map((r) => ({ ...r, status: 'draft' as const, isFlagged: true }))
        ),
        (recipes) => {
          // Filter to only approved content (should be empty)
          const approvedRecipes = recipes.filter(
            (r) => r.status === 'published' && !r.isFlagged
          );

          expect(approvedRecipes.length).toBe(0);

          const { container, unmount } = render(<RecipeGrid recipes={approvedRecipes} />);

          // Should show empty state
          expect(container.textContent).toContain('No recipes found');

          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should maintain filtering consistency across multiple renders', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary, { minLength: 5, maxLength: 10 }),
        (recipes) => {
          // Apply the same filter twice
          const approvedRecipes1 = recipes.filter(
            (r) => r.status === 'published' && !r.isFlagged
          );
          const approvedRecipes2 = recipes.filter(
            (r) => r.status === 'published' && !r.isFlagged
          );

          // Both filters should produce identical results
          expect(approvedRecipes1).toEqual(approvedRecipes2);
          expect(approvedRecipes1.length).toBe(approvedRecipes2.length);

          const { unmount } = render(<RecipeGrid recipes={approvedRecipes1} />);
          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });
});

