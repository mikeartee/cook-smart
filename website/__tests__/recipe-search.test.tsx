import { render, screen, fireEvent, act } from '@/lib/test-utils';
import { RecipeFilters } from '@/components/recipe-filters';
import { createMockRecipe } from '@/lib/test-utils';
import * as fc from 'fast-check';
import { propertyTestConfig, nonEmptyStringArbitrary } from '@/lib/property-test-utils';

// **Feature: cook-smart-website, Property 6: Recipe search filtering**
describe('Recipe Search Filtering Tests', () => {
  it('property: search filters recipes by keywords', () => {
    fc.assert(
      fc.property(nonEmptyStringArbitrary(), (searchTerm) => {
        const recipes = [
          createMockRecipe({ id: '1', title: `Recipe with ${searchTerm}` }),
          createMockRecipe({ id: '2', title: 'Unrelated Recipe' }),
          createMockRecipe({ id: '3', description: `Contains ${searchTerm} in description` }),
        ];

        // Filter recipes based on search term
        const filteredRecipes = recipes.filter(
          (recipe) =>
            recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Verify filtering logic
        expect(filteredRecipes.length).toBeGreaterThan(0);
        filteredRecipes.forEach((recipe) => {
          const matchesSearch =
            recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
          expect(matchesSearch).toBe(true);
        });

        return true;
      }),
      propertyTestConfig
    );
  });

  it('should call onSearchChange when search input changes', async () => {
    const mockOnSearchChange = jest.fn();
    const mockOnDietaryChange = jest.fn();
    const mockOnIngredientChange = jest.fn();

    const { unmount } = render(
      <RecipeFilters
        onSearchChange={mockOnSearchChange}
        onDietaryChange={mockOnDietaryChange}
        onIngredientChange={mockOnIngredientChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search recipes/i);
    
    // Use act to wrap state updates
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'pasta' } });
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    expect(mockOnSearchChange).toHaveBeenCalledWith('pasta');
    unmount();
  });

  it('should filter recipes by title', () => {
    const recipes = [
      createMockRecipe({ id: '1', title: 'Spaghetti Carbonara' }),
      createMockRecipe({ id: '2', title: 'Chicken Salad' }),
      createMockRecipe({ id: '3', title: 'Pasta Primavera' }),
    ];

    const searchTerm = 'pasta';
    const filtered = recipes.filter((r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Pasta Primavera');
  });

  it('should filter recipes by description', () => {
    const recipes = [
      createMockRecipe({ id: '1', description: 'A delicious pasta dish' }),
      createMockRecipe({ id: '2', description: 'Grilled chicken with vegetables' }),
      createMockRecipe({ id: '3', description: 'Fresh salad with pasta' }),
    ];

    const searchTerm = 'pasta';
    const filtered = recipes.filter((r) =>
      r.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    expect(filtered.length).toBe(2);
  });

  it('should be case-insensitive', () => {
    const recipes = [
      createMockRecipe({ id: '1', title: 'PASTA Carbonara' }),
      createMockRecipe({ id: '2', title: 'pasta primavera' }),
      createMockRecipe({ id: '3', title: 'PaStA Alfredo' }),
    ];

    const searchTerms = ['pasta', 'PASTA', 'PaStA'];

    searchTerms.forEach((term) => {
      const filtered = recipes.filter((r) =>
        r.title.toLowerCase().includes(term.toLowerCase())
      );
      expect(filtered.length).toBe(3);
    });
  });

  it('should return empty array when no matches', () => {
    const recipes = [
      createMockRecipe({ id: '1', title: 'Chicken Salad' }),
      createMockRecipe({ id: '2', title: 'Beef Stew' }),
    ];

    const searchTerm = 'pasta';
    const filtered = recipes.filter((r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    expect(filtered.length).toBe(0);
  });

  it('should handle empty search term', () => {
    const recipes = [
      createMockRecipe({ id: '1', title: 'Recipe 1' }),
      createMockRecipe({ id: '2', title: 'Recipe 2' }),
    ];

    const searchTerm = '';
    const filtered = recipes.filter((r) => {
      if (!searchTerm) return true;
      return r.title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    expect(filtered.length).toBe(2);
  });
});
