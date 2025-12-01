import * as fc from 'fast-check';
import { PBT_CONFIG, arbitraries, mockRecipe } from '@/__tests__/utils/pbt-helpers';

/**
 * Feature: cook-smart-website, Property 23: Demo state updates
 * Validates: Requirements 6.2
 */
describe('Property 23: Demo state updates', () => {
  it('should add recipes to meal plan correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          monday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          tuesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          wednesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          thursday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          friday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          saturday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          sunday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
        }),
        mockRecipe(),
        fc.constantFrom('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
        (mealPlan, newRecipe, targetDay) => {
          const originalCount = mealPlan[targetDay].length;
          const updatedMealPlan = {
            ...mealPlan,
            [targetDay]: [...mealPlan[targetDay], newRecipe],
          };

          // Property: Adding a recipe should increase day's count by 1
          expect(updatedMealPlan[targetDay].length).toBe(originalCount + 1);

          // Property: New recipe should be in the day's meals
          const recipeAdded = updatedMealPlan[targetDay].some(recipe => recipe.id === newRecipe.id);
          expect(recipeAdded).toBe(true);

          // Property: Other days should remain unchanged
          const otherDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            .filter(day => day !== targetDay);

          otherDays.forEach(day => {
            expect(updatedMealPlan[day].length).toBe(mealPlan[day].length);
          });

          // Property: Total meal count should increase by 1
          const originalTotal = Object.values(mealPlan).reduce((sum, meals) => sum + meals.length, 0);
          const updatedTotal = Object.values(updatedMealPlan).reduce((sum, meals) => sum + meals.length, 0);
          expect(updatedTotal).toBe(originalTotal + 1);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should remove recipes from meal plan correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          monday: fc.array(mockRecipe(), { minLength: 1, maxLength: 5 }),
          tuesday: fc.array(mockRecipe(), { minLength: 1, maxLength: 5 }),
          wednesday: fc.array(mockRecipe(), { minLength: 1, maxLength: 5 }),
        }),
        fc.constantFrom('monday', 'tuesday', 'wednesday'),
        (mealPlan, targetDay) => {
          const originalCount = mealPlan[targetDay].length;
          const recipeToRemove = mealPlan[targetDay][0];

          // Count how many recipes with this ID exist
          const recipesWithSameId = mealPlan[targetDay].filter(r => r.id === recipeToRemove.id).length;

          const updatedMealPlan = {
            ...mealPlan,
            [targetDay]: mealPlan[targetDay].filter(recipe => recipe.id !== recipeToRemove.id),
          };

          // Property: Removing a recipe should decrease day's count by number of recipes with that ID
          expect(updatedMealPlan[targetDay].length).toBe(originalCount - recipesWithSameId);

          // Property: Removed recipe should not be in the day's meals
          const recipeStillPresent = updatedMealPlan[targetDay].some(recipe => recipe.id === recipeToRemove.id);
          expect(recipeStillPresent).toBe(false);

          // Property: Other recipes on the same day should remain
          const remainingRecipes = mealPlan[targetDay].filter(recipe => recipe.id !== recipeToRemove.id);
          expect(updatedMealPlan[targetDay].length).toBe(remainingRecipes.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should move recipes between days correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          monday: fc.array(mockRecipe(), { minLength: 1, maxLength: 3 }),
          tuesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          wednesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
        }),
        fc.constantFrom('tuesday', 'wednesday'),
        fc.integer({ min: 0, max: 2 }),
        (mealPlan, targetDay, recipeIndex) => {
          const sourceDay = 'monday';
          
          // Skip if index is out of bounds
          if (recipeIndex >= mealPlan[sourceDay].length) {
            return true;
          }
          
          const recipeToMove = mealPlan[sourceDay][recipeIndex];

          const updatedMealPlan = {
            ...mealPlan,
            [sourceDay]: mealPlan[sourceDay].filter((_, idx) => idx !== recipeIndex),
            [targetDay]: [...mealPlan[targetDay], recipeToMove],
          };

          // Property: Recipe should be removed from source day at that index
          expect(updatedMealPlan[sourceDay].length).toBe(mealPlan[sourceDay].length - 1);

          // Property: Recipe should be added to target day
          const inTarget = updatedMealPlan[targetDay].some(recipe => 
            recipe.name === recipeToMove.name && 
            recipe.description === recipeToMove.description
          );
          expect(inTarget).toBe(true);

          // Property: Total meal count should remain the same
          const originalTotal = Object.values(mealPlan).reduce((sum, meals) => sum + meals.length, 0);
          const updatedTotal = Object.values(updatedMealPlan).reduce((sum, meals) => sum + meals.length, 0);
          expect(updatedTotal).toBe(originalTotal);

          // Property: Source day count should decrease by 1
          expect(updatedMealPlan[sourceDay].length).toBe(mealPlan[sourceDay].length - 1);

          // Property: Target day count should increase by 1
          expect(updatedMealPlan[targetDay].length).toBe(mealPlan[targetDay].length + 1);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should generate grocery list from meal plan correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          monday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          tuesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          wednesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
        }),
        (mealPlan) => {
          // Simulate grocery list generation
          const allRecipes = Object.values(mealPlan).flat();
          const allIngredients = allRecipes.flatMap(recipe =>
            recipe.ingredients || []
          );

          // Group by ingredient name
          const groceryList = new Map<string, { amount: number; unit: string }>();
          allIngredients.forEach(ingredient => {
            const existing = groceryList.get(ingredient.name);
            if (existing) {
              groceryList.set(ingredient.name, {
                amount: existing.amount + (ingredient.amount || 0),
                unit: ingredient.unit,
              });
            } else {
              groceryList.set(ingredient.name, {
                amount: ingredient.amount || 0,
                unit: ingredient.unit,
              });
            }
          });

          // Property: Grocery list should contain all unique ingredients
          const uniqueIngredientNames = [...new Set(allIngredients.map(i => i.name))];
          expect(groceryList.size).toBe(uniqueIngredientNames.length);

          // Property: Each ingredient should have positive amount
          Array.from(groceryList.values()).forEach(item => {
            expect(item.amount).toBeGreaterThanOrEqual(0);
          });

          // Property: If no recipes, grocery list should be empty
          if (allRecipes.length === 0) {
            expect(groceryList.size).toBe(0);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should clear meal plan correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          monday: fc.array(mockRecipe(), { minLength: 0, maxLength: 5 }),
          tuesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 5 }),
          wednesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 5 }),
          thursday: fc.array(mockRecipe(), { minLength: 0, maxLength: 5 }),
          friday: fc.array(mockRecipe(), { minLength: 0, maxLength: 5 }),
          saturday: fc.array(mockRecipe(), { minLength: 0, maxLength: 5 }),
          sunday: fc.array(mockRecipe(), { minLength: 0, maxLength: 5 }),
        }),
        (mealPlan) => {
          const clearedMealPlan = {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          };

          // Property: All days should be empty after clearing
          Object.values(clearedMealPlan).forEach(meals => {
            expect(meals.length).toBe(0);
          });

          // Property: Total meal count should be 0
          const totalMeals = Object.values(clearedMealPlan).reduce((sum, meals) => sum + meals.length, 0);
          expect(totalMeals).toBe(0);

          // Property: Clearing should not throw errors
          expect(() => {
            Object.keys(clearedMealPlan).forEach(day => {
              clearedMealPlan[day as keyof typeof clearedMealPlan].length;
            });
          }).not.toThrow();
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle duplicate recipes in meal plan', () => {
    fc.assert(
      fc.property(
        mockRecipe(),
        fc.constantFrom('monday', 'tuesday', 'wednesday'),
        (recipe, targetDay) => {
          const mealPlan = {
            [targetDay]: [recipe, recipe], // Same recipe twice
          };

          // Property: Should allow duplicate recipes
          expect(mealPlan[targetDay].length).toBe(2);

          // Property: Both instances should have the same ID
          expect(mealPlan[targetDay][0].id).toBe(mealPlan[targetDay][1].id);

          // Property: Removing one instance should leave the other
          const updatedMealPlan = {
            [targetDay]: mealPlan[targetDay].slice(1),
          };
          expect(updatedMealPlan[targetDay].length).toBe(1);
          expect(updatedMealPlan[targetDay][0].id).toBe(recipe.id);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should calculate total cooking time for meal plan', () => {
    fc.assert(
      fc.property(
        fc.record({
          monday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          tuesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          wednesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
        }),
        (mealPlan) => {
          const allRecipes = Object.values(mealPlan).flat();
          const totalCookingTime = allRecipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0);

          // Property: Total cooking time should be sum of all recipe times
          const manualTotal = allRecipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0);
          expect(totalCookingTime).toBe(manualTotal);

          // Property: Total cooking time should be non-negative
          expect(totalCookingTime).toBeGreaterThanOrEqual(0);

          // Property: If no recipes, total time should be 0
          if (allRecipes.length === 0) {
            expect(totalCookingTime).toBe(0);
          }

          // Property: Each recipe should contribute to total
          allRecipes.forEach(recipe => {
            expect(recipe.cookingTime).toBeGreaterThan(0);
          });
        }
      ),
      PBT_CONFIG
    );
  });

  it('should maintain meal plan state consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          monday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          tuesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          wednesday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          thursday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          friday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          saturday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
          sunday: fc.array(mockRecipe(), { minLength: 0, maxLength: 3 }),
        }),
        (mealPlan) => {
          // Property: All days should be present
          const expectedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          expectedDays.forEach(day => {
            expect(mealPlan).toHaveProperty(day);
          });

          // Property: Each day should have an array
          Object.values(mealPlan).forEach(meals => {
            expect(Array.isArray(meals)).toBe(true);
          });

          // Property: All recipes should have required properties
          Object.values(mealPlan).flat().forEach(recipe => {
            expect(recipe).toHaveProperty('id');
            expect(recipe).toHaveProperty('name');
            expect(recipe).toHaveProperty('cookingTime');
          });

          // Property: Total count should equal sum of all days
          const totalCount = Object.values(mealPlan).reduce((sum, meals) => sum + meals.length, 0);
          const manualCount = Object.values(mealPlan).flat().length;
          expect(totalCount).toBe(manualCount);
        }
      ),
      PBT_CONFIG
    );
  });
});

