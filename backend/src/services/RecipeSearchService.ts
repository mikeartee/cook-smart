export interface SearchFilters {
  ingredients?: string[];
  cuisine?: string;
  mealType?: string;
  cookingTime?: number;
  difficulty?: string;
  servings?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  mealType: string;
  imageUrl?: string;
  nutritionInfo?: any;
}

export interface SearchResult {
  recipes: Recipe[];
  totalCount: number;
  page: number;
  pageSize: number;
}

import UnifiedRecipeService from './UnifiedRecipeService';

export class RecipeSearchService {
  private static mockRecipes: Recipe[] = [
    {
      id: '1',
      title: 'Vegetarian Pasta',
      description: 'Simple pasta with vegetables',
      ingredients: ['pasta', 'tomatoes', 'basil', 'olive oil'],
      instructions: ['Boil pasta', 'Add vegetables', 'Season'],
      cookingTime: 20,
      servings: 4,
      difficulty: 'easy',
      cuisine: 'italian',
      mealType: 'dinner',
    },
    {
      id: '2',
      title: 'Chicken Stir Fry',
      description: 'Quick chicken and vegetable stir fry',
      ingredients: ['chicken breast', 'broccoli', 'soy sauce', 'rice'],
      instructions: ['Cook chicken', 'Add vegetables', 'Serve with rice'],
      cookingTime: 15,
      servings: 2,
      difficulty: 'easy',
      cuisine: 'asian',
      mealType: 'dinner',
    },
  ];

  static async searchRecipes(
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SearchResult> {
    try {
      // Use UnifiedRecipeService which includes FatSecret + Spoonacular
      const recipes = await UnifiedRecipeService.searchRecipes(query, {
        maxResults: pageSize,
        dietary: filters.cuisine ? [filters.cuisine] : undefined,
        maxCalories: filters.cookingTime
          ? filters.cookingTime * 100
          : undefined,
        includeIngredients: filters.ingredients,
      });

      // Convert to our Recipe format
      const formattedRecipes: Recipe[] = recipes.map(r => ({
        id: r.id,
        title: r.title,
        description: r.summary || '',
        ingredients: r.ingredients.map(i => i.name),
        instructions: r.instructions?.split('\n') || [],
        cookingTime: r.readyInMinutes,
        servings: r.servings,
        difficulty: r.readyInMinutes < 30 ? 'easy' : 'medium',
        cuisine: filters.cuisine || 'international',
        mealType: filters.mealType || 'dinner',
        imageUrl: r.image,
        nutritionInfo: r.nutrition,
      }));

      return {
        recipes: formattedRecipes,
        totalCount: formattedRecipes.length,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('[RecipeSearch] Error:', error);
      // Fallback to mock recipes
      let filteredRecipes = [...this.mockRecipes];

      // Text search
      if (query) {
        const searchTerm = query.toLowerCase();
        filteredRecipes = filteredRecipes.filter(
          recipe =>
            recipe.title.toLowerCase().includes(searchTerm) ||
            recipe.description.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.some(ing =>
              ing.toLowerCase().includes(searchTerm),
            ),
        );
      }

      // Apply filters
      if (filters.ingredients?.length) {
        filteredRecipes = filteredRecipes.filter(recipe =>
          filters.ingredients!.some(filterIng =>
            recipe.ingredients.some(recipeIng =>
              recipeIng.toLowerCase().includes(filterIng.toLowerCase()),
            ),
          ),
        );
      }

      if (filters.cuisine) {
        filteredRecipes = filteredRecipes.filter(
          recipe =>
            recipe.cuisine.toLowerCase() === filters.cuisine!.toLowerCase(),
        );
      }

      if (filters.mealType) {
        filteredRecipes = filteredRecipes.filter(
          recipe =>
            recipe.mealType.toLowerCase() === filters.mealType!.toLowerCase(),
        );
      }

      if (filters.cookingTime) {
        filteredRecipes = filteredRecipes.filter(
          recipe => recipe.cookingTime <= filters.cookingTime!,
        );
      }

      if (filters.difficulty) {
        filteredRecipes = filteredRecipes.filter(
          recipe =>
            recipe.difficulty.toLowerCase() ===
            filters.difficulty!.toLowerCase(),
        );
      }

      if (filters.servings) {
        filteredRecipes = filteredRecipes.filter(
          recipe => recipe.servings >= filters.servings!,
        );
      }

      // Pagination
      const startIndex = (page - 1) * pageSize;
      const paginatedRecipes = filteredRecipes.slice(
        startIndex,
        startIndex + pageSize,
      );

      return {
        recipes: paginatedRecipes,
        totalCount: filteredRecipes.length,
        page,
        pageSize,
      };
    }
  }

  static async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      // Check if it's a FatSecret recipe (starts with fs_)
      if (id.startsWith('fs_')) {
        const recipe = await UnifiedRecipeService.getRecipeDetails(
          id.replace('fs_', ''),
          'fatsecret',
        );
        if (recipe) {
          return {
            id: recipe.id,
            title: recipe.title,
            description: recipe.summary || '',
            ingredients: recipe.ingredients.map(i => i.name),
            instructions: recipe.instructions?.split('\n') || [],
            cookingTime: recipe.readyInMinutes,
            servings: recipe.servings,
            difficulty: recipe.readyInMinutes < 30 ? 'easy' : 'medium',
            cuisine: 'international',
            mealType: 'dinner',
            imageUrl: recipe.image,
            nutritionInfo: recipe.nutrition,
          };
        }
      }

      // Check if it's a Spoonacular recipe
      const spoonacularRecipe = await UnifiedRecipeService.getRecipeDetails(
        id,
        'spoonacular',
      );
      if (spoonacularRecipe) {
        return {
          id: spoonacularRecipe.id,
          title: spoonacularRecipe.title,
          description: spoonacularRecipe.summary || '',
          ingredients: spoonacularRecipe.ingredients.map(i => i.name),
          instructions: spoonacularRecipe.instructions?.split('\n') || [],
          cookingTime: spoonacularRecipe.readyInMinutes,
          servings: spoonacularRecipe.servings,
          difficulty: spoonacularRecipe.readyInMinutes < 30 ? 'easy' : 'medium',
          cuisine: 'international',
          mealType: 'dinner',
          imageUrl: spoonacularRecipe.image,
          nutritionInfo: spoonacularRecipe.nutrition,
        };
      }

      // Fallback to mock recipes
      return this.mockRecipes.find(recipe => recipe.id === id) || null;
    } catch (error) {
      console.error('[RecipeSearch] Get by ID error:', error);
      return this.mockRecipes.find(recipe => recipe.id === id) || null;
    }
  }

  static async getRecipesByIngredients(
    ingredients: string[],
  ): Promise<Recipe[]> {
    return this.mockRecipes.filter(recipe =>
      ingredients.some(ingredient =>
        recipe.ingredients.some(recipeIng =>
          recipeIng.toLowerCase().includes(ingredient.toLowerCase()),
        ),
      ),
    );
  }
}
