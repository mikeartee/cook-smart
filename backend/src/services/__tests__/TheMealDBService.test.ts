/**
 * Unit Tests for TheMealDBService
 */

import { TheMealDBService } from '../TheMealDBService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TheMealDBService', () => {
  let themealdbService: TheMealDBService;

  beforeEach(() => {
    themealdbService = new TheMealDBService();
    jest.clearAllMocks();
  });

  describe('searchByIngredients', () => {
    it('should search with first ingredient and return mapped recipes', async () => {
      const mockFilterResponse = {
        data: {
          meals: [
            { idMeal: '52772', strMeal: 'Teriyaki Chicken', strMealThumb: 'https://example.com/image1.jpg' },
            { idMeal: '52795', strMeal: 'Chicken Handi', strMealThumb: 'https://example.com/image2.jpg' },
          ],
        },
      };

      const mockLookupResponse1 = {
        data: {
          meals: [{
            idMeal: '52772',
            strMeal: 'Teriyaki Chicken',
            strMealThumb: 'https://example.com/image1.jpg',
            strCategory: 'Chicken',
            strArea: 'Japanese',
            strInstructions: 'Cook the chicken...',
            strIngredient1: 'chicken',
            strMeasure1: '1 lb',
            strIngredient2: 'soy sauce',
            strMeasure2: '2 tbsp',
            strIngredient3: '',
            strSource: 'https://example.com/recipe1',
            strTags: 'Meat,Spicy',
          }],
        },
      };

      const mockLookupResponse2 = {
        data: {
          meals: [{
            idMeal: '52795',
            strMeal: 'Chicken Handi',
            strMealThumb: 'https://example.com/image2.jpg',
            strCategory: 'Chicken',
            strArea: 'Indian',
            strInstructions: 'Prepare the curry...',
            strIngredient1: 'chicken',
            strMeasure1: '2 lbs',
            strIngredient2: 'curry powder',
            strMeasure2: '1 tbsp',
            strIngredient3: '',
            strSource: 'https://example.com/recipe2',
          }],
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockFilterResponse)
        .mockResolvedValueOnce(mockLookupResponse1)
        .mockResolvedValueOnce(mockLookupResponse2);

      const results = await themealdbService.searchByIngredients(['chicken', 'rice'], 10);

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        id: '52772',
        title: 'Teriyaki Chicken',
        image: 'https://example.com/image1.jpg',
        cuisines: ['Japanese'],
        dishTypes: ['Chicken'],
        provider: 'themealdb',
      });
      expect(results[0]?.ingredients).toContain('1 lb chicken');
      expect(results[0]?.ingredients).toContain('2 tbsp soy sauce');
    });

    it('should handle empty ingredient list', async () => {
      const results = await themealdbService.searchByIngredients([], 10);
      expect(results).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should handle no meals found', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { meals: null },
      });

      const results = await themealdbService.searchByIngredients(['nonexistent'], 10);
      expect(results).toEqual([]);
    });

    it('should limit results to specified limit', async () => {
      const mockFilterResponse = {
        data: {
          meals: [
            { idMeal: '1', strMeal: 'Recipe 1' },
            { idMeal: '2', strMeal: 'Recipe 2' },
            { idMeal: '3', strMeal: 'Recipe 3' },
            { idMeal: '4', strMeal: 'Recipe 4' },
            { idMeal: '5', strMeal: 'Recipe 5' },
          ],
        },
      };

      const mockLookupResponse = {
        data: {
          meals: [{
            idMeal: '1',
            strMeal: 'Recipe 1',
            strCategory: 'Test',
            strArea: 'Test',
            strInstructions: 'Test',
            strIngredient1: 'test',
            strMeasure1: '1 cup',
          }],
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockFilterResponse)
        .mockResolvedValue(mockLookupResponse);

      const results = await themealdbService.searchByIngredients(['test'], 2);
      
      // Should only fetch details for 2 recipes
      expect(results).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3); // 1 filter + 2 lookups
    });
  });

  describe('getRecipeDetails', () => {
    it('should fetch and map recipe details correctly', async () => {
      const mockResponse = {
        data: {
          meals: [{
            idMeal: '52772',
            strMeal: 'Teriyaki Chicken',
            strMealThumb: 'https://example.com/image.jpg',
            strCategory: 'Chicken',
            strArea: 'Japanese',
            strInstructions: 'Cook the chicken with teriyaki sauce.',
            strSource: 'https://example.com/recipe',
            strYoutube: 'https://youtube.com/watch?v=abc',
            strTags: 'Meat,Spicy,Dinner',
            strIngredient1: 'chicken breast',
            strMeasure1: '1 lb',
            strIngredient2: 'soy sauce',
            strMeasure2: '2 tbsp',
            strIngredient3: 'ginger',
            strMeasure3: '1 tsp',
            strIngredient4: '',
            strMeasure4: '',
          }],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await themealdbService.getRecipeDetails('52772');

      expect(result).toMatchObject({
        id: '52772',
        title: 'Teriyaki Chicken',
        image: 'https://example.com/image.jpg',
        servings: 4,
        readyInMinutes: 30,
        sourceUrl: 'https://example.com/recipe',
        summary: 'Chicken from Japanese',
        instructions: 'Cook the chicken with teriyaki sauce.',
        cuisines: ['Japanese'],
        dishTypes: ['Chicken'],
        provider: 'themealdb',
      });

      expect(result.ingredients).toHaveLength(3);
      expect(result.ingredients).toContain('1 lb chicken breast');
      expect(result.ingredients).toContain('2 tbsp soy sauce');
      expect(result.ingredients).toContain('1 tsp ginger');
    });

    it('should extract ingredients correctly, skipping empty ones', async () => {
      const mockResponse = {
        data: {
          meals: [{
            idMeal: '123',
            strMeal: 'Test Recipe',
            strCategory: 'Test',
            strArea: 'Test',
            strInstructions: 'Test',
            strIngredient1: 'ingredient1',
            strMeasure1: '1 cup',
            strIngredient2: 'ingredient2',
            strMeasure2: '',
            strIngredient3: '',
            strMeasure3: '',
            strIngredient4: 'ingredient4',
            strMeasure4: '2 tbsp',
          }],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await themealdbService.getRecipeDetails('123');

      expect(result.ingredients).toHaveLength(3);
      expect(result.ingredients).toContain('1 cup ingredient1');
      expect(result.ingredients).toContain('ingredient2');
      expect(result.ingredients).toContain('2 tbsp ingredient4');
    });

    it('should handle missing optional fields', async () => {
      const mockResponse = {
        data: {
          meals: [{
            idMeal: '999',
            strMeal: 'Minimal Recipe',
            // Missing most optional fields
          }],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await themealdbService.getRecipeDetails('999');

      expect(result).toMatchObject({
        id: '999',
        title: 'Minimal Recipe',
        servings: 4,
        readyInMinutes: 30,
        summary: 'Unknown category from Unknown region',
        instructions: 'No instructions available.',
        cuisines: [],
        dishTypes: [],
        diets: [],
      });
    });

    it('should throw error when recipe not found', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { meals: null },
      });

      await expect(
        themealdbService.getRecipeDetails('nonexistent')
      ).rejects.toThrow('Recipe not found');
    });

    it('should use YouTube URL as fallback when source URL missing', async () => {
      const mockResponse = {
        data: {
          meals: [{
            idMeal: '456',
            strMeal: 'Video Recipe',
            strCategory: 'Test',
            strArea: 'Test',
            strInstructions: 'Test',
            strYoutube: 'https://youtube.com/watch?v=xyz',
            strIngredient1: 'test',
            strMeasure1: '1 cup',
          }],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await themealdbService.getRecipeDetails('456');

      expect(result.sourceUrl).toBe('https://youtube.com/watch?v=xyz');
    });
  });

  describe('isAvailable', () => {
    it('should always return true (unlimited API)', async () => {
      const available = await themealdbService.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe('getProviderName', () => {
    it('should return "TheMealDB"', () => {
      expect(themealdbService.getProviderName()).toBe('TheMealDB');
    });
  });
});
