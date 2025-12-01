'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RecipeGrid } from '@/components/recipe-grid';
import { RecipeFilters } from '@/components/recipe-filters';
import { recipeApi, Recipe } from '@/lib/api/recipes';

export default function RecipesPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Get filter values from URL
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [dietary, setDietary] = useState<string[]>(
    searchParams.get('dietary')?.split(',').filter(Boolean) || []
  );
  const [ingredients, setIngredients] = useState(searchParams.get('ingredients') || '');

  // Update URL params when filters change
  const updateURLParams = useCallback(
    (newSearch: string, newDietary: string[], newIngredients: string) => {
      const params = new URLSearchParams();
      if (newSearch) params.set('search', newSearch);
      if (newDietary.length > 0) params.set('dietary', newDietary.join(','));
      if (newIngredients) params.set('ingredients', newIngredients);
      
      const newURL = params.toString() ? `/recipes?${params.toString()}` : '/recipes';
      router.push(newURL, { scroll: false });
    },
    [router]
  );

  // Fetch recipes
  const fetchRecipes = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      setIsLoading(true);
      
      const filters: any = {};
      
      if (search) filters.search = search;
      if (dietary.length > 0) filters.dietary = dietary;
      if (ingredients) filters.ingredients = ingredients;
      
      const response = await recipeApi.getPaginatedRecipes(pageNum, 12, filters);
      
      if (reset) {
        setRecipes(response.recipes);
      } else {
        setRecipes((prev) => [...prev, ...response.recipes]);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, dietary, ingredients]);

  // Load recipes when filters change
  useEffect(() => {
    setPage(1);
    fetchRecipes(1, true);
  }, [search, dietary, ingredients, fetchRecipes]);

  // Handle filter changes
  const handleSearchChange = useCallback(
    (newSearch: string) => {
      setSearch(newSearch);
      updateURLParams(newSearch, dietary, ingredients);
    },
    [dietary, ingredients, updateURLParams]
  );

  const handleDietaryChange = useCallback(
    (newDietary: string[]) => {
      setDietary(newDietary);
      updateURLParams(search, newDietary, ingredients);
    },
    [search, ingredients, updateURLParams]
  );

  const handleIngredientChange = useCallback(
    (newIngredients: string) => {
      setIngredients(newIngredients);
      updateURLParams(search, dietary, newIngredients);
    },
    [search, dietary, updateURLParams]
  );

  // Load more recipes
  const loadMore = (): void => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecipes(nextPage, false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <h1 className="mb-4 text-4xl font-bold">Discover Recipes</h1>
          <p className="text-lg text-muted-foreground">
            Browse our collection of delicious recipes from the Cook Smart community
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8">
          <RecipeFilters
            onSearchChange={handleSearchChange}
            onDietaryChange={handleDietaryChange}
            onIngredientChange={handleIngredientChange}
            searchValue={search}
            dietaryValue={dietary}
            ingredientValue={ingredients}
          />
        </div>

        {/* Results Count */}
        {!isLoading && recipes.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Recipe Grid */}
        <RecipeGrid recipes={recipes} isLoading={isLoading && page === 1} />

        {/* Load More Button */}
        {!isLoading && hasMore && recipes.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Load More Recipes
            </button>
          </div>
        )}

        {/* Loading More Indicator */}
        {isLoading && page > 1 && (
          <div className="mt-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
}
