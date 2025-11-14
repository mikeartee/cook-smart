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
      mealType: 'dinner'
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
      mealType: 'dinner'
    }
  ];

  static async searchRecipes(
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<SearchResult> {
    let filteredRecipes = [...this.mockRecipes];

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm) ||
        recipe.description.toLowerCase().includes(searchTerm) ||
        recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm))
      );
    }

    // Apply filters
    if (filters.ingredients?.length) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        filters.ingredients!.some(filterIng =>
          recipe.ingredients.some(recipeIng =>
            recipeIng.toLowerCase().includes(filterIng.toLowerCase())
          )
        )
      );
    }

    if (filters.cuisine) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.cuisine.toLowerCase() === filters.cuisine!.toLowerCase()
      );
    }

    if (filters.mealType) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.mealType.toLowerCase() === filters.mealType!.toLowerCase()
      );
    }

    if (filters.cookingTime) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.cookingTime <= filters.cookingTime!
      );
    }

    if (filters.difficulty) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.difficulty.toLowerCase() === filters.difficulty!.toLowerCase()
      );
    }

    if (filters.servings) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.servings >= filters.servings!
      );
    }

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedRecipes = filteredRecipes.slice(startIndex, startIndex + pageSize);

    return {
      recipes: paginatedRecipes,
      totalCount: filteredRecipes.length,
      page,
      pageSize
    };
  }

  static async getRecipeById(id: string): Promise<Recipe | null> {
    return this.mockRecipes.find(recipe => recipe.id === id) || null;
  }

  static async getRecipesByIngredients(ingredients: string[]): Promise<Recipe[]> {
    return this.mockRecipes.filter(recipe =>
      ingredients.some(ingredient =>
        recipe.ingredients.some(recipeIng =>
          recipeIng.toLowerCase().includes(ingredient.toLowerCase())
        )
      )
    );
  }
}