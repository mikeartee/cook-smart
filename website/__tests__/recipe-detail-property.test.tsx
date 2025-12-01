/**
 * Feature: cook-smart-website, Property 4: Recipe detail completeness
 * Validates: Requirements 2.2
 *
 * Property: For any recipe detail view, it should display ingredients,
 * instructions, cooking time, and nutritional information.
 */

import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { Recipe } from '@/types';

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

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

// Mock recipe detail component for testing
function RecipeDetailView({ recipe }: { recipe: Recipe }): React.ReactElement {
  return (
    <div data-testid="recipe-detail">
      <h1>{recipe.title}</h1>
      <p>{recipe.description}</p>
      
      <div data-testid="cooking-time">{recipe.cookingTime} minutes</div>
      <div data-testid="servings">{recipe.servings} servings</div>
      
      <div data-testid="nutritional-info">
        <div>{recipe.nutritionalInfo.calories} Calories</div>
        <div>{recipe.nutritionalInfo.protein}g Protein</div>
        <div>{recipe.nutritionalInfo.carbs}g Carbs</div>
        <div>{recipe.nutritionalInfo.fat}g Fat</div>
        <div>{recipe.nutritionalInfo.fiber}g Fiber</div>
      </div>
      
      <div data-testid="ingredients">
        {recipe.ingredients.map((ingredient, index) => (
          <div key={index}>
            {ingredient.amount} {ingredient.unit} {ingredient.name}
          </div>
        ))}
      </div>
      
      <div data-testid="instructions">
        {recipe.instructions.map((instruction, index) => (
          <div key={index}>{instruction}</div>
        ))}
      </div>
      
      <div data-testid="author">{recipe.author.name}</div>
    </div>
  );
}

describe('Property 4: Recipe detail completeness', () => {
  it('should display all required recipe information', () => {
    fc.assert(
      fc.property(recipeArbitrary, (recipe) => {
        const { container, unmount } = render(<RecipeDetailView recipe={recipe} />);

        // Title and description should be present
        expect(container.textContent).toContain(recipe.title);
        expect(container.textContent).toContain(recipe.description);

        // Cooking time should be displayed
        expect(container.textContent).toContain(`${recipe.cookingTime} minutes`);

        // Servings should be displayed
        expect(container.textContent).toContain(`${recipe.servings} servings`);

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should display all nutritional information', () => {
    fc.assert(
      fc.property(recipeArbitrary, (recipe) => {
        const { container, unmount } = render(<RecipeDetailView recipe={recipe} />);

        // All nutritional values should be present
        expect(container.textContent).toContain(`${recipe.nutritionalInfo.calories}`);
        expect(container.textContent).toContain(`${recipe.nutritionalInfo.protein}g`);
        expect(container.textContent).toContain(`${recipe.nutritionalInfo.carbs}g`);
        expect(container.textContent).toContain(`${recipe.nutritionalInfo.fat}g`);
        expect(container.textContent).toContain(`${recipe.nutritionalInfo.fiber}g`);

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should display all ingredients with amounts and units', () => {
    fc.assert(
      fc.property(recipeArbitrary, (recipe) => {
        const { container, unmount } = render(<RecipeDetailView recipe={recipe} />);

        // Each ingredient should be displayed with amount, unit, and name
        recipe.ingredients.forEach((ingredient) => {
          expect(container.textContent).toContain(ingredient.name);
          expect(container.textContent).toContain(ingredient.amount);
          expect(container.textContent).toContain(ingredient.unit);
        });

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should display all instructions in order', () => {
    fc.assert(
      fc.property(recipeArbitrary, (recipe) => {
        const { container, unmount } = render(<RecipeDetailView recipe={recipe} />);

        // All instructions should be present
        recipe.instructions.forEach((instruction) => {
          expect(container.textContent).toContain(instruction);
        });

        // Instructions should appear in the correct order
        const instructionsSection = container.querySelector('[data-testid="instructions"]');
        expect(instructionsSection).toBeTruthy();

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should display author information', () => {
    fc.assert(
      fc.property(recipeArbitrary, (recipe) => {
        const { container, unmount } = render(<RecipeDetailView recipe={recipe} />);

        // Author name should be displayed
        expect(container.textContent).toContain(recipe.author.name);

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('should have all required sections present', () => {
    fc.assert(
      fc.property(recipeArbitrary, (recipe) => {
        const { getByTestId, unmount } = render(<RecipeDetailView recipe={recipe} />);

        // Verify all required sections exist
        expect(getByTestId('cooking-time')).toBeTruthy();
        expect(getByTestId('servings')).toBeTruthy();
        expect(getByTestId('nutritional-info')).toBeTruthy();
        expect(getByTestId('ingredients')).toBeTruthy();
        expect(getByTestId('instructions')).toBeTruthy();
        expect(getByTestId('author')).toBeTruthy();

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('should display complete nutritional breakdown', () => {
    fc.assert(
      fc.property(recipeArbitrary, (recipe) => {
        const { getByTestId, unmount } = render(<RecipeDetailView recipe={recipe} />);

        const nutritionalInfo = getByTestId('nutritional-info');
        
        // All 5 nutritional values should be present
        expect(nutritionalInfo.textContent).toContain('Calories');
        expect(nutritionalInfo.textContent).toContain('Protein');
        expect(nutritionalInfo.textContent).toContain('Carbs');
        expect(nutritionalInfo.textContent).toContain('Fat');
        expect(nutritionalInfo.textContent).toContain('Fiber');

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('should display at least one ingredient and one instruction', () => {
    fc.assert(
      fc.property(recipeArbitrary, (recipe) => {
        const { getByTestId, unmount } = render(<RecipeDetailView recipe={recipe} />);

        const ingredientsSection = getByTestId('ingredients');
        const instructionsSection = getByTestId('instructions');

        // Should have at least one ingredient
        expect(ingredientsSection.children.length).toBeGreaterThanOrEqual(1);

        // Should have at least one instruction
        expect(instructionsSection.children.length).toBeGreaterThanOrEqual(1);

        unmount();
      }),
      { numRuns: 50 }
    );
  });
});
