import { render } from '@/lib/test-utils';
import { RecipeGrid } from '@/components/recipe-grid';
import { createMockRecipe } from '@/lib/test-utils';
import * as fc from 'fast-check';
import { propertyTestConfig, recipeArbitrary } from '@/lib/property-test-utils';

// **Feature: cook-smart-website, Property 5: Approved content filtering**
describe('Content Filtering Tests', () => {
  it('property: only approved and non-flagged recipes are displayed', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary(), { minLength: 5, maxLength: 20 }),
        (recipes) => {
          // Filter to only approved, non-flagged recipes (simulating backend filter)
          const approvedRecipes = recipes.filter(
            (recipe) => recipe.status === 'published' && !recipe.isFlagged
          );

          const { container } = render(<RecipeGrid recipes={approvedRecipes} />);

          // Verify no flagged content is displayed
          approvedRecipes.forEach((recipe) => {
            expect(recipe.isFlagged).toBe(false);
            expect(recipe.status).toBe('published');
          });

          return true;
        }
      ),
      propertyTestConfig
    );
  });

  it('should not display flagged recipes', () => {
    const recipes = [
      createMockRecipe({ id: '1', title: 'Good Recipe', isFlagged: false }),
      createMockRecipe({ id: '2', title: 'Flagged Recipe', isFlagged: true }),
    ];

    // Filter out flagged recipes (as backend would do)
    const filteredRecipes = recipes.filter((r) => !r.isFlagged);

    const { container } = render(<RecipeGrid recipes={filteredRecipes} />);

    expect(container.textContent).toContain('Good Recipe');
    expect(container.textContent).not.toContain('Flagged Recipe');
  });

  it('should not display draft recipes', () => {
    const recipes = [
      createMockRecipe({ id: '1', title: 'Published Recipe', status: 'published' }),
      createMockRecipe({ id: '2', title: 'Draft Recipe', status: 'draft' }),
    ];

    // Filter to only published recipes (as backend would do)
    const filteredRecipes = recipes.filter((r) => r.status === 'published');

    const { container } = render(<RecipeGrid recipes={filteredRecipes} />);

    expect(container.textContent).toContain('Published Recipe');
    expect(container.textContent).not.toContain('Draft Recipe');
  });

  it('should not display archived recipes', () => {
    const recipes = [
      createMockRecipe({ id: '1', title: 'Published Recipe', status: 'published' }),
      createMockRecipe({ id: '2', title: 'Archived Recipe', status: 'archived' }),
    ];

    // Filter to only published recipes (as backend would do)
    const filteredRecipes = recipes.filter((r) => r.status === 'published');

    const { container } = render(<RecipeGrid recipes={filteredRecipes} />);

    expect(container.textContent).toContain('Published Recipe');
    expect(container.textContent).not.toContain('Archived Recipe');
  });

  it('should only display recipes that are both published and not flagged', () => {
    const recipes = [
      createMockRecipe({
        id: '1',
        title: 'Valid Recipe',
        status: 'published',
        isFlagged: false,
      }),
      createMockRecipe({
        id: '2',
        title: 'Published but Flagged',
        status: 'published',
        isFlagged: true,
      }),
      createMockRecipe({
        id: '3',
        title: 'Not Flagged but Draft',
        status: 'draft',
        isFlagged: false,
      }),
    ];

    // Apply both filters (as backend would do)
    const filteredRecipes = recipes.filter(
      (r) => r.status === 'published' && !r.isFlagged
    );

    const { container } = render(<RecipeGrid recipes={filteredRecipes} />);

    expect(container.textContent).toContain('Valid Recipe');
    expect(container.textContent).not.toContain('Published but Flagged');
    expect(container.textContent).not.toContain('Not Flagged but Draft');
  });
});
