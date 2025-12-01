import { render, screen } from '@/lib/test-utils';
import { RecipeCard } from '@/components/recipe-card';
import { RecipeGrid } from '@/components/recipe-grid';
import { createMockRecipe } from '@/lib/test-utils';
import * as fc from 'fast-check';
import { propertyTestConfig, recipeArbitrary } from '@/lib/property-test-utils';

// **Feature: cook-smart-website, Property 3: Recipe grid completeness**
describe('Recipe Grid Tests', () => {
  it('property: recipe cards display complete information', () => {
    fc.assert(
      fc.property(
        fc.array(recipeArbitrary(), { minLength: 1, maxLength: 12 }),
        (recipes) => {
          const { container } = render(<RecipeGrid recipes={recipes} />);

          // Verify each recipe has required elements
          recipes.forEach((recipe) => {
            // Check title is present
            const titleElements = container.querySelectorAll('h3');
            const hasTitle = Array.from(titleElements).some((el) =>
              el.textContent?.includes(recipe.title)
            );
            expect(hasTitle).toBe(true);

            // Check description is present
            expect(container.textContent).toContain(recipe.description);

            // Check cooking time is displayed
            expect(container.textContent).toContain(`${recipe.cookingTime} min`);
          });

          return true;
        }
      ),
      propertyTestConfig
    );
  });

  it('should render recipe card with all required elements', () => {
    const recipe = createMockRecipe();
    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByText(recipe.title)).toBeInTheDocument();
    expect(screen.getByText(recipe.description)).toBeInTheDocument();
    expect(screen.getByText(`${recipe.cookingTime} min`)).toBeInTheDocument();
    expect(screen.getByText(`${recipe.servings} servings`)).toBeInTheDocument();
    expect(screen.getByText(recipe.author.name)).toBeInTheDocument();
  });

  it('should display featured badge for featured recipes', () => {
    const recipe = createMockRecipe({ isFeatured: true });
    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('should not display featured badge for non-featured recipes', () => {
    const recipe = createMockRecipe({ isFeatured: false });
    render(<RecipeCard recipe={recipe} />);

    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('should render loading state', () => {
    const { container } = render(<RecipeGrid recipes={[]} isLoading={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state when no recipes', () => {
    render(<RecipeGrid recipes={[]} isLoading={false} />);
    expect(screen.getByText('No recipes found')).toBeInTheDocument();
  });

  it('should render multiple recipes in grid', () => {
    const recipes = [
      createMockRecipe({ id: '1', title: 'Recipe 1' }),
      createMockRecipe({ id: '2', title: 'Recipe 2' }),
      createMockRecipe({ id: '3', title: 'Recipe 3' }),
    ];

    render(<RecipeGrid recipes={recipes} />);

    expect(screen.getByText('Recipe 1')).toBeInTheDocument();
    expect(screen.getByText('Recipe 2')).toBeInTheDocument();
    expect(screen.getByText('Recipe 3')).toBeInTheDocument();
  });
});
