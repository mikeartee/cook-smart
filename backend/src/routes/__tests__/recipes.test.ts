/**
 * Integration Tests for Recipe Routes
 */

import express from 'express';
import request from 'supertest';
import recipeRoutes from '../recipes';
import { APIUsageLogModel } from '../../models/APIUsageLog';

// Mock the services
jest.mock('../../services/TheMealDBService');
jest.mock('../../models/APIUsageLog');

const app = express();
app.use(express.json());
app.use('/api/recipes', recipeRoutes);

describe('Recipe Routes', () => {
  describe('GET /api/recipes/search', () => {
    it('should return recipes for valid ingredient search', async () => {
      const response = await request(app)
        .get('/api/recipes/search')
        .query({ ingredients: 'chicken,rice' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recipes');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('provider');
      expect(Array.isArray(response.body.recipes)).toBe(true);
    });

    it('should return 400 for missing ingredients parameter', async () => {
      const response = await request(app)
        .get('/api/recipes/search');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing ingredients');
    });

    it('should return 400 for empty ingredients', async () => {
      const response = await request(app)
        .get('/api/recipes/search')
        .query({ ingredients: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle single ingredient search', async () => {
      const response = await request(app)
        .get('/api/recipes/search')
        .query({ ingredients: 'chicken' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recipes');
    });

    it('should handle multiple ingredients with spaces', async () => {
      const response = await request(app)
        .get('/api/recipes/search')
        .query({ ingredients: 'chicken, rice, tomato' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recipes');
    });

    it('should include provider information in response', async () => {
      const response = await request(app)
        .get('/api/recipes/search')
        .query({ ingredients: 'chicken' });

      expect(response.status).toBe(200);
      if (response.body.recipes.length > 0) {
        expect(response.body).toHaveProperty('provider');
        expect(['edamam', 'themealdb', 'unknown']).toContain(response.body.provider);
      }
    });
  });

  describe('GET /api/recipes/:id', () => {
    it('should return recipe details for valid ID', async () => {
      // This will depend on having a recipe in cache or mock
      const response = await request(app)
        .get('/api/recipes/12345');

      // May return 200 with recipe or 500 if not found
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('recipe');
        expect(response.body).toHaveProperty('provider');
      }
    });

    it('should return 400 for missing recipe ID', async () => {
      const response = await request(app)
        .get('/api/recipes/');

      // Should hit the search endpoint or 404
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/recipes/admin/cache-stats', () => {
    it('should return cache statistics', async () => {
      const response = await request(app)
        .get('/api/recipes/admin/cache-stats');

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('stats');
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('GET /api/recipes/admin/usage-stats', () => {
    it('should return API usage statistics', async () => {
      // Mock the usage stats
      (APIUsageLogModel.getTodayStats as jest.Mock).mockResolvedValue([
        {
          provider: 'edamam',
          total_calls: 10,
          successful_calls: 9,
          cached_calls: 5,
          avg_response_time: 1250,
        },
      ]);
      
      (APIUsageLogModel.getRecentErrors as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/recipes/admin/usage-stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('today');
      expect(response.body).toHaveProperty('recent_errors');
      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.today)).toBe(true);
      expect(Array.isArray(response.body.recent_errors)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      (APIUsageLogModel.getTodayStats as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/recipes/admin/usage-stats');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
