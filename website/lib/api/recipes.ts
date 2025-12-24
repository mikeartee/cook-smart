/**
 * Recipe API - Unified interface for internal and TheMealDB recipes
 * Handles caching and fallback to TheMealDB when internal API is unavailable
 */

import { themealdb } from './themealdb';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
  approved: boolean;
  featured: boolean;
  imageUrl: string;
  createdAt: Date;
  category?: string;
  cuisine?: string;
  instructions?: string[];
  ingredients?: Array<{ name: string; amount: string }>;
  youtubeUrl?: string;
  source: 'themealdb' | 'internal';
}

interface RecipeFilters {
  search?: string;
  category?: string;
  dietary?: string[];
  difficulty?: string;
  maxCookingTime?: number;
}

interface PaginatedRecipes {
  recipes: Recipe[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Internal API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cooksmartapp.com';

// Cache for internal recipes
const internalCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes for internal API

function getCached<T>(key: string): T | null {
  const cached = internalCache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    internalCache.delete(key);
    return null;
  }

  return cached.data as T;
}

function setCache(key: string, data: any): void {
  internalCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch recipes from internal API
 */
async function fetchInternalRecipes(filters: RecipeFilters = {}): Promise<Recipe[]> {
  const cacheKey = `internal:${JSON.stringify(filters)}`;
  const cached = getCached<Recipe[]>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.maxCookingTime) params.append('maxCookingTime', filters.maxCookingTime.toString());

    const response = await fetch(`${API_BASE_URL}/api/recipes?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) throw new Error('Internal API failed');

    const data = await response.json();
    const recipes = data.recipes.map((r: any) => ({ ...r, source: 'internal' as const }));

    setCache(cacheKey, recipes);
    return recipes;
  } catch (_error) {
    console.warn('Internal API unavailable, using TheMealDB fallback');
    return [];
  }
}

/**
 * Merge and deduplicate recipes from multiple sources
 */
function _mergeRecipes(internal: Recipe[], external: Recipe[]): Recipe[] {
  const merged = [...internal];
  const existingIds = new Set(internal.map(r => r.id));

  for (const recipe of external) {
    if (!existingIds.has(recipe.id)) {
      merged.push(recipe);
      existingIds.add(recipe.id);
    }
  }

  return merged;
}

/**
 * Apply filters to recipe list
 */
function applyFilters(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
  let filtered = recipes;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(searchLower) ||
      r.description.toLowerCase().includes(searchLower)
    );
  }

  if (filters.category) {
    filtered = filtered.filter(r =>
      r.category?.toLowerCase() === filters.category?.toLowerCase()
    );
  }

  if (filters.dietary && filters.dietary.length > 0) {
    filtered = filtered.filter(r =>
      filters.dietary!.some(tag => r.dietaryTags.includes(tag))
    );
  }

  if (filters.difficulty) {
    filtered = filtered.filter(r => r.difficulty === filters.difficulty);
  }

  if (filters.maxCookingTime) {
    filtered = filtered.filter(r => r.cookingTime <= filters.maxCookingTime!);
  }

  return filtered;
}

export const recipeApi = {
  /**
   * Get all recipes with optional filters
   * Combines internal and TheMealDB recipes
   */
  async getRecipes(filters: RecipeFilters = {}): Promise<Recipe[]> {
    // Try internal API first
    const internalRecipes = await fetchInternalRecipes(filters);

    // If we have internal recipes, use them
    if (internalRecipes.length > 0) {
      return internalRecipes;
    }

    // Fallback to TheMealDB
    let externalRecipes: Recipe[] = [];

    if (filters.search) {
      externalRecipes = await themealdb.searchByName(filters.search);
    } else if (filters.category) {
      externalRecipes = await themealdb.getByCategory(filters.category);
    } else {
      // Get random recipes for homepage
      externalRecipes = await themealdb.getRandom(20);
    }

    // Apply additional filters
    return applyFilters(externalRecipes, filters);
  },

  /**
   * Get paginated recipes
   */
  async getPaginatedRecipes(
    page: number = 1,
    pageSize: number = 12,
    filters: RecipeFilters = {}
  ): Promise<PaginatedRecipes> {
    const allRecipes = await this.getRecipes(filters);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const recipes = allRecipes.slice(start, end);

    return {
      recipes,
      total: allRecipes.length,
      page,
      pageSize,
      hasMore: end < allRecipes.length,
    };
  },

  /**
   * Get recipe by ID
   * Checks internal API first, then TheMealDB
   */
  async getRecipeById(id: string): Promise<Recipe | null> {
    // Try internal API first
    try {
      const response = await fetch(`${API_BASE_URL}/api/recipes/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 300 },
      });

      if (response.ok) {
        const recipe = await response.json();
        return { ...recipe, source: 'internal' as const };
      }
    } catch (_error) {
      console.warn('Internal API unavailable for recipe:', id);
    }

    // Fallback to TheMealDB
    return themealdb.getById(id);
  },

  /**
   * Get featured recipes
   */
  async getFeaturedRecipes(limit: number = 6): Promise<Recipe[]> {
    const recipes = await this.getRecipes();
    return recipes.filter(r => r.featured).slice(0, limit);
  },

  /**
   * Get categories
   */
  async getCategories(): Promise<string[]> {
    // Try internal API first
    try {
      const response = await fetch(`${API_BASE_URL}/api/recipes/categories`, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (response.ok) {
        const data = await response.json();
        return data.categories;
      }
    } catch (_error) {
      console.warn('Internal API unavailable for categories');
    }

    // Fallback to TheMealDB
    return themealdb.getCategories();
  },

  /**
   * Search recipes
   */
  async searchRecipes(query: string): Promise<Recipe[]> {
    return this.getRecipes({ search: query });
  },

  /**
   * Clear all caches
   */
  clearCache(): void {
    internalCache.clear();
    themealdb.clearCache();
  },
};

