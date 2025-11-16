/**
 * Unit Tests for EdamamService
 */

import { EdamamService } from '../EdamamService';
import axios from 'axios';
import rateLimitTracker from '../RateLimitTracker';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock rate limit tracker
jest.mock('../RateLimitTracker', () => ({
  __esModule: true,
  default: {
    checkLimit: jest.fn(),
    incrementCount: jest.fn(),
    getUsage: jest.fn(),
  },
}));

// Mock RecipeCacheModel
jest.mock('../../models/RecipeCache', () => ({
  RecipeCacheModel: {
    getCachedRecipe: jest.fn(),
    cacheRecipe: jest.fn(),
  },
}));

describe('EdamamService', () => {
  let edamamService: EdamamService;

  beforeEach(() => {
    // Set environment variables
    process.env.EDAMAM_APP_ID = 'test_app_id';
    process.env.EDAMAM_APP_KEY = 'test_app_key';
    
    edamamService = new EdamamService();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('searchByIngredients', () => {
    it('should map Edamam API response to Recipe model correctly', async () => {
      const mockEdamamResponse = {
        data: {
          hits: [
            {
              recipe: {
                uri: 'http://www.edamam.com/ontologies/edamam.owl#recipe_abc123',
                label: 'Chicken Rice Bowl',
                image: 'https://example.com/image.jpg',
                source: 'Food Network',
                url: 'https://example.com/recipe',
                yield: 4,
                totalTime: 30,
                ingredientLines: ['2 cups rice', '1 lb chicken'],
                instructions: 'Cook rice. Cook chicken. Combine.',
                cuisineType: ['asian'],
                dishType: ['main course'],
                dietLabels: ['low-carb'],
                calories: 450,
                totalNutrients: {
                  PROCNT: { quantity: 35 },
                  CHOCDF: { quantity: 45 },
                  FAT: { quantity: 15 },
                },
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockEdamamResponse);
      (rateLimitTracker.incrementCount as jest.Mock).mockResolvedValue(undefined);

      const results = await edamamService.searchByIngredients(['chicken', 'rice'], 10);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'abc123',
        title: 'Chicken Rice Bowl',
        image: 'https://example.com/image.jpg',
        servings: 4,
        readyInMinutes: 30,
        sourceUrl: 'https://example.com/recipe',
        ingredients: ['2 cups rice', '1 lb chicken'],
        instructions: 'Cook rice. Cook chicken. Combine.',
        cuisines: ['asian'],
        dishTypes: ['main course'],
        diets: ['low-carb'],
        provider: 'edamam',
      });
      
      expect(results[0].nutrition).toMatchObject({
        calories: 450,
        protein: 35,
        carbs: 45,
        fat: 15,
      });
    });

    it('should handle missing optional fields gracefully', async () => {
      const mockEdamamResponse = {
        data: {
          hits: [
            {
              recipe: {
                uri: 'http://www.edamam.com/ontologies/edamam.owl#recipe_xyz789',
                label: 'Simple Recipe',
                // Missing many optional fields
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockEdamamResponse);
      (rateLimitTracker.incrementCount as jest.Mock).mockResolvedValue(undefined);

      const results = await edamamService.searchByIngredients(['test'], 10);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'xyz789',
        title: 'Simple Recipe',
        servings: 4, // default
        readyInMinutes: 30, // default
        ingredients: [],
        cuisines: [],
        dishTypes: [],
        diets: [],
      });
    });

    it('should throw error when credentials are not configured', async () => {
      delete process.env.EDAMAM_APP_ID;
      delete process.env.EDAMAM_APP_KEY;
      
      const service = new EdamamService();

      await expect(
        service.searchByIngredients(['chicken'], 10)
      ).rejects.toThrow('Edamam API credentials not configured');
    });

    it('should handle rate limit errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 429,
          data: { message: 'Rate limit exceeded' },
        },
      });
      (rateLimitTracker.incrementCount as jest.Mock).mockResolvedValue(undefined);

      await expect(
        edamamService.searchByIngredients(['chicken'], 10)
      ).rejects.toThrow('Edamam rate limit exceeded');
    });

    it('should handle authentication errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      });
      (rateLimitTracker.incrementCount as jest.Mock).mockResolvedValue(undefined);

      await expect(
        edamamService.searchByIngredients(['chicken'], 10)
      ).rejects.toThrow('Edamam API credentials invalid');
    });

    it('should increment rate limit counter on each call', async () => {
      const mockEdamamResponse = {
        data: { hits: [] },
      };

      mockedAxios.get.mockResolvedValue(mockEdamamResponse);
      (rateLimitTracker.incrementCount as jest.Mock).mockResolvedValue(undefined);

      await edamamService.searchByIngredients(['chicken'], 10);

      expect(rateLimitTracker.incrementCount).toHaveBeenCalledWith('edamam');
    });
  });

  describe('isAvailable', () => {
    it('should return true when within rate limit', async () => {
      (rateLimitTracker.checkLimit as jest.Mock).mockResolvedValue(true);

      const available = await edamamService.isAvailable();

      expect(available).toBe(true);
      expect(rateLimitTracker.checkLimit).toHaveBeenCalledWith('edamam', 333);
    });

    it('should return false when rate limit exceeded', async () => {
      (rateLimitTracker.checkLimit as jest.Mock).mockResolvedValue(false);
      (rateLimitTracker.getUsage as jest.Mock).mockReturnValue({
        count: 333,
        resetTime: new Date(),
      });

      const available = await edamamService.isAvailable();

      expect(available).toBe(false);
    });

    it('should return false when credentials not configured', async () => {
      delete process.env.EDAMAM_APP_ID;
      
      const service = new EdamamService();
      const available = await service.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe('getProviderName', () => {
    it('should return "Edamam"', () => {
      expect(edamamService.getProviderName()).toBe('Edamam');
    });
  });

  describe('getRecipeDetails', () => {
    it('should retrieve recipe from cache', async () => {
      const { RecipeCacheModel } = require('../../models/RecipeCache');
      const mockCachedRecipe = {
        recipe_data: {
          id: 'abc123',
          title: 'Cached Recipe',
          provider: 'edamam',
        },
      };

      RecipeCacheModel.getCachedRecipe.mockResolvedValue(mockCachedRecipe);

      const result = await edamamService.getRecipeDetails('abc123');

      expect(result).toEqual(mockCachedRecipe.recipe_data);
      expect(RecipeCacheModel.getCachedRecipe).toHaveBeenCalledWith('abc123');
    });

    it('should throw error when recipe not in cache', async () => {
      const { RecipeCacheModel } = require('../../models/RecipeCache');
      RecipeCacheModel.getCachedRecipe.mockResolvedValue(null);

      await expect(
        edamamService.getRecipeDetails('nonexistent')
      ).rejects.toThrow('Recipe not found in cache');
    });
  });
});
