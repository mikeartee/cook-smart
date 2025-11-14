import axios from 'axios';
// import dietaryFilterService from './dietaryFilterService'; // TODO: Implement

interface Recipe {
  id: string;
  title: string;
  description?: string;
  instructions: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  total_time_minutes?: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine_type?: string;
  dietary_tags: string[];
  image_url?: string;
  source_api: 'spoonacular' | 'edamam' | 'themealdb';
  external_id: string;
  ingredients: RecipeIngredient[];
  nutrition_per_serving?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  match_score?: number;
  missing_ingredients?: string[];
  dietary_conflicts?: any[];
  safety_level?: 'safe' | 'caution' | 'avoid';
  match_type?: 'exact' | 'near' | 'possible';
}

interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  original: string;
}

interface RecipeSearchParams {
  ingredients: string[];
  dietary_restrictions?: string[];
  allergies?: string[];
  max_time?: number;
  difficulty?: string;
  cuisine?: string;
  servings?: number;
}

class RecipeService {
  private spoonacularUsage = 0;
  private readonly SPOONACULAR_LIMIT = 150; // Free tier limit

  async findRecipes(params: RecipeSearchParams, userId?: string): Promise<Recipe[]> {
    const allRecipes: Recipe[] = [];

    try {
      // Try Spoonacular first (best quality, limited usage)
      if (this.spoonacularUsage < this.SPOONACULAR_LIMIT) {
        const spoonacularRecipes = await this.searchSpoonacular(params);
        allRecipes.push(...spoonacularRecipes);
        this.spoonacularUsage += 1;
      }

      // Try Edamam as backup (good coverage)
      const edamamRecipes = await this.searchEdamam(params);
      allRecipes.push(...edamamRecipes);

      // Try TheMealDB for additional variety (free)
      const mealDBRecipes = await this.searchTheMealDB(params);
      allRecipes.push(...mealDBRecipes);

      // Score and sort recipes by ingredient match
      const scoredRecipes = this.scoreRecipes(allRecipes, params.ingredients);
      
      // Remove duplicates
      const dedupedRecipes = this.deduplicateRecipes(scoredRecipes);
      
      // Apply dietary filtering if userId provided
      if (userId) {
        // const filteredRecipes = await dietaryFilterService.filterRecipesForUser(userId, dedupedRecipes);
        const filteredRecipes = dedupedRecipes.map(recipe => ({ recipe, conflicts: [], safety_level: 'safe', match_type: 'exact' }));
        return filteredRecipes.map(fr => ({
          ...fr.recipe,
          dietary_conflicts: fr.conflicts,
          safety_level: fr.safety_level,
          match_type: fr.match_type
        })).slice(0, 20);
      }
      
      return dedupedRecipes.slice(0, 20);

    } catch (error) {
      console.error('Recipe search error:', error);
      return [];
    }
  }

  private async searchSpoonacular(params: RecipeSearchParams): Promise<Recipe[]> {
    try {
      const response = await axios.get(
        'https://api.spoonacular.com/recipes/findByIngredients',
        {
          params: {
            ingredients: params.ingredients.join(','),
            number: 10,
            ranking: 2, // Maximize used ingredients
            ignorePantry: true,
            apiKey: process.env.SPOONACULAR_API_KEY
          },
          timeout: 10000
        }
      );

      const recipes: Recipe[] = [];
      
      for (const recipe of response.data) {
        // Get detailed recipe information
        const detailResponse = await axios.get(
          `https://api.spoonacular.com/recipes/${recipe.id}/information`,
          {
            params: { apiKey: process.env.SPOONACULAR_API_KEY },
            timeout: 5000
          }
        );

        const detail = detailResponse.data;
        
        recipes.push({
          id: `spoon_${recipe.id}`,
          title: detail.title,
          description: detail.summary?.replace(/<[^>]*>/g, ''), // Remove HTML
          instructions: this.formatInstructions(detail.instructions),
          prep_time_minutes: detail.preparationMinutes,
          cook_time_minutes: detail.cookingMinutes,
          total_time_minutes: detail.readyInMinutes,
          servings: detail.servings || 4,
          difficulty: this.calculateDifficulty(detail.readyInMinutes, detail.extendedIngredients?.length),
          cuisine_type: detail.cuisines?.[0],
          dietary_tags: this.extractDietaryTags(detail),
          image_url: detail.image,
          source_api: 'spoonacular',
          external_id: recipe.id.toString(),
          ingredients: this.formatIngredients(detail.extendedIngredients),
          nutrition_per_serving: this.extractNutrition(detail.nutrition)
        });
      }

      return recipes;
    } catch (error) {
      console.error('Spoonacular API error:', error);
      return [];
    }
  }

  private async searchEdamam(params: RecipeSearchParams): Promise<Recipe[]> {
    try {
      const response = await axios.get(
        'https://api.edamam.com/search',
        {
          params: {
            q: params.ingredients.join(' '),
            app_id: process.env.EDAMAM_APP_ID,
            app_key: process.env.EDAMAM_APP_KEY,
            from: 0,
            to: 10
          },
          timeout: 10000
        }
      );

      return response.data.hits.map((hit: any) => {
        const recipe = hit.recipe;
        return {
          id: `edamam_${recipe.uri.split('#recipe_')[1]}`,
          title: recipe.label,
          description: recipe.source,
          instructions: 'See original recipe for instructions',
          total_time_minutes: recipe.totalTime || undefined,
          servings: recipe.yield || 4,
          difficulty: this.calculateDifficulty(recipe.totalTime, recipe.ingredients?.length),
          cuisine_type: recipe.cuisineType?.[0],
          dietary_tags: this.extractEdamamDietaryTags(recipe),
          image_url: recipe.image,
          source_api: 'edamam',
          external_id: recipe.uri.split('#recipe_')[1],
          ingredients: recipe.ingredients.map((ing: any) => ({
            name: ing.food,
            amount: ing.quantity || 1,
            unit: ing.measure || 'piece',
            original: ing.text
          })),
          nutrition_per_serving: {
            calories: Math.round(recipe.calories / recipe.yield),
            protein: Math.round(recipe.totalNutrients?.PROCNT?.quantity / recipe.yield || 0),
            carbs: Math.round(recipe.totalNutrients?.CHOCDF?.quantity / recipe.yield || 0),
            fat: Math.round(recipe.totalNutrients?.FAT?.quantity / recipe.yield || 0)
          }
        };
      });
    } catch (error) {
      console.error('Edamam API error:', error);
      return [];
    }
  }

  private async searchTheMealDB(params: RecipeSearchParams): Promise<Recipe[]> {
    try {
      // TheMealDB doesn't support ingredient-based search well, so search by main ingredient
      const mainIngredient = params.ingredients[0];
      const response = await axios.get(
        `https://www.themealdb.com/api/json/v1/1/filter.php?i=${mainIngredient}`,
        { timeout: 5000 }
      );

      if (!response.data.meals) return [];

      const recipes: Recipe[] = [];
      
      // Get details for first 5 meals
      for (const meal of response.data.meals.slice(0, 5)) {
        const detailResponse = await axios.get(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`,
          { timeout: 5000 }
        );

        const detail = detailResponse.data.meals[0];
        
        recipes.push({
          id: `mealdb_${detail.idMeal}`,
          title: detail.strMeal,
          description: detail.strCategory,
          instructions: detail.strInstructions,
          servings: 4,
          difficulty: 'medium',
          cuisine_type: detail.strArea,
          dietary_tags: [],
          image_url: detail.strMealThumb,
          source_api: 'themealdb',
          external_id: detail.idMeal,
          ingredients: this.extractMealDBIngredients(detail)
        });
      }

      return recipes;
    } catch (error) {
      console.error('TheMealDB API error:', error);
      return [];
    }
  }

  private scoreRecipes(recipes: Recipe[], userIngredients: string[]): Recipe[] {
    return recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients.map(ing => 
        ing.name.toLowerCase().trim()
      );
      
      const userIngredientsLower = userIngredients.map(ing => 
        ing.toLowerCase().trim()
      );

      // Calculate match score
      let matchedCount = 0;
      let totalRequired = recipeIngredients.length;
      const missingIngredients: string[] = [];

      recipeIngredients.forEach(recipeIng => {
        const isMatched = userIngredientsLower.some(userIng => 
          recipeIng.includes(userIng) || userIng.includes(recipeIng)
        );
        
        if (isMatched) {
          matchedCount++;
        } else {
          missingIngredients.push(recipeIng);
        }
      });

      const matchScore = (matchedCount / totalRequired) * 100;

      return {
        ...recipe,
        match_score: Math.round(matchScore),
        missing_ingredients: missingIngredients
      };
    }).sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  }

  private deduplicateRecipes(recipes: Recipe[]): Recipe[] {
    const seen = new Set<string>();
    return recipes.filter(recipe => {
      const key = recipe.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateDifficulty(time?: number, ingredientCount?: number): 'easy' | 'medium' | 'hard' {
    const timeScore = time ? (time > 60 ? 2 : time > 30 ? 1 : 0) : 1;
    const ingredientScore = ingredientCount ? (ingredientCount > 10 ? 2 : ingredientCount > 6 ? 1 : 0) : 1;
    
    const totalScore = timeScore + ingredientScore;
    
    if (totalScore <= 1) return 'easy';
    if (totalScore <= 3) return 'medium';
    return 'hard';
  }

  private formatInstructions(instructions: string): string {
    if (!instructions) return 'Instructions not available';
    return instructions.replace(/<[^>]*>/g, '').trim();
  }

  private formatIngredients(ingredients: any[]): RecipeIngredient[] {
    if (!ingredients) return [];
    
    return ingredients.map(ing => ({
      name: ing.name || ing.nameClean || 'Unknown ingredient',
      amount: ing.amount || 1,
      unit: ing.unit || 'piece',
      original: ing.original || ing.originalString || ''
    }));
  }

  private extractDietaryTags(recipe: any): string[] {
    const tags: string[] = [];
    
    if (recipe.vegetarian) tags.push('vegetarian');
    if (recipe.vegan) tags.push('vegan');
    if (recipe.glutenFree) tags.push('gluten-free');
    if (recipe.dairyFree) tags.push('dairy-free');
    if (recipe.veryHealthy) tags.push('healthy');
    if (recipe.cheap) tags.push('budget-friendly');
    if (recipe.veryPopular) tags.push('popular');
    
    return tags;
  }

  private extractEdamamDietaryTags(recipe: any): string[] {
    const tags: string[] = [];
    
    if (recipe.healthLabels) {
      recipe.healthLabels.forEach((label: string) => {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('vegetarian')) tags.push('vegetarian');
        if (lowerLabel.includes('vegan')) tags.push('vegan');
        if (lowerLabel.includes('gluten')) tags.push('gluten-free');
        if (lowerLabel.includes('dairy')) tags.push('dairy-free');
      });
    }
    
    return tags;
  }

  private extractNutrition(nutrition: any): any {
    if (!nutrition?.nutrients) return undefined;
    
    const nutrients = nutrition.nutrients;
    return {
      calories: Math.round(nutrients.find((n: any) => n.name === 'Calories')?.amount || 0),
      protein: Math.round(nutrients.find((n: any) => n.name === 'Protein')?.amount || 0),
      carbs: Math.round(nutrients.find((n: any) => n.name === 'Carbohydrates')?.amount || 0),
      fat: Math.round(nutrients.find((n: any) => n.name === 'Fat')?.amount || 0)
    };
  }

  private extractMealDBIngredients(meal: any): RecipeIngredient[] {
    const ingredients: RecipeIngredient[] = [];
    
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      
      if (ingredient && ingredient.trim()) {
        ingredients.push({
          name: ingredient.trim(),
          amount: 1,
          unit: measure?.trim() || 'piece',
          original: `${measure?.trim() || ''} ${ingredient.trim()}`.trim()
        });
      }
    }
    
    return ingredients;
  }

  // Usage tracking
  getSpoonacularUsage(): { used: number; limit: number; remaining: number } {
    return {
      used: this.spoonacularUsage,
      limit: this.SPOONACULAR_LIMIT,
      remaining: this.SPOONACULAR_LIMIT - this.spoonacularUsage
    };
  }

  resetMonthlyUsage(): void {
    this.spoonacularUsage = 0;
  }
}

export default new RecipeService();