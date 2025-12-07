import express from 'express';
import {authenticateToken, AuthRequest} from '../middleware/auth';
import pool from '../config/database';
import {DietaryRestrictionModel} from '../models/DietaryRestriction';
import {AllergyModel} from '../models/Allergy';
import {IngredientSubstitutionService} from '../services/IngredientSubstitutionService';

const router = express.Router();

// Get personalized "For You" recipe feed
router.get(
  '/for-you',
  authenticateToken,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      // Get user preferences
      const [restrictions, allergens] = await Promise.all([
        DietaryRestrictionModel.getUserRestrictions(userId),
        AllergyModel.getAllUserTriggerIngredients(userId),
      ]);

      // Build preference scoring query
      let preferenceConditions = [];
      let preferenceWeights = [];

      // Vegetarian preference
      if (restrictions.some(r => r.name.toLowerCase().includes('vegetarian'))) {
        preferenceConditions.push("dietary_info->>'vegetarian' = 'true'");
        preferenceWeights.push('2');
      }

      // Vegan preference
      if (restrictions.some(r => r.name.toLowerCase().includes('vegan'))) {
        preferenceConditions.push("dietary_info->>'vegan' = 'true'");
        preferenceWeights.push('3');
      }

      // Gluten-free preference
      if (restrictions.some(r => r.name.toLowerCase().includes('gluten'))) {
        preferenceConditions.push("dietary_info->>'glutenFree' = 'true'");
        preferenceWeights.push('2');
      }

      // Dairy-free preference
      if (restrictions.some(r => r.name.toLowerCase().includes('dairy'))) {
        preferenceConditions.push("dietary_info->>'dairyFree' = 'true'");
        preferenceWeights.push('2');
      }

      // Build the CASE statement for preference scoring
      const preferenceScoreSQL =
        preferenceConditions.length > 0
          ? `CASE ${preferenceConditions.map((cond, i) => `WHEN ${cond} THEN ${preferenceWeights[i]}`).join(' ')} ELSE 1 END`
          : '1';

      // Get recipes with preference scoring
      const result = await pool.query(
        `SELECT *, 
        ${preferenceScoreSQL} as preference_score,
        trending_score,
        view_count
      FROM recipe_cache
      ORDER BY preference_score DESC, trending_score DESC, view_count DESC
      LIMIT $1`,
        [limit * 2], // Get more than needed for filtering
      );

      // Analyze each recipe for conflicts and substitutions
      const analyzed = await Promise.all(
        result.rows.map(async recipe => {
          try {
            const ingredients = Array.isArray(recipe.ingredients)
              ? recipe.ingredients
              : [];
            const conflicts = {
              severe: [] as string[],
              moderate: [] as string[],
              mild: [] as string[],
              dietary: [] as string[],
            };

            // Check each ingredient
            ingredients.forEach((ing: any) => {
              const name = ing.name.toLowerCase();

              if (
                allergens.severe.some((t: string) =>
                  name.includes(t.toLowerCase()),
                )
              ) {
                conflicts.severe.push(ing.name);
              } else if (
                allergens.moderate.some((t: string) =>
                  name.includes(t.toLowerCase()),
                )
              ) {
                conflicts.moderate.push(ing.name);
              } else if (
                allergens.mild.some((t: string) =>
                  name.includes(t.toLowerCase()),
                )
              ) {
                conflicts.mild.push(ing.name);
              }
            });

            // Get substitutions
            const allConflicts = [
              ...conflicts.severe,
              ...conflicts.moderate,
              ...conflicts.mild,
            ];

            const substitutions =
              allConflicts.length > 0
                ? IngredientSubstitutionService.getSubstitutions(
                    allConflicts,
                    conflicts.severe.length > 0 ? 'allergy' : 'dietary',
                  )
                : [];

            // Calculate match score (0-100)
            const totalIngredients = ingredients.length;
            const conflictCount = allConflicts.length;
            const matchScore =
              totalIngredients > 0
                ? Math.round(
                    ((totalIngredients - conflictCount) / totalIngredients) *
                      100,
                  )
                : 100;

            return {
              ...recipe,
              conflicts,
              substitutionCount: substitutions.length,
              canBeModified: substitutions.length > 0,
              matchScore,
              preferenceScore: recipe.preference_score,
            };
          } catch (error) {
            console.error(
              `[For You] Error analyzing recipe ${recipe.id}:`,
              error,
            );
            return null;
          }
        }),
      );

      // Filter out nulls and limit results
      const validRecipes = analyzed.filter(r => r !== null).slice(0, limit);

      // Generate personalization message
      const preferenceNames = restrictions.map(r => r.name);
      const message =
        preferenceNames.length > 0
          ? `Recipes personalized for: ${preferenceNames.join(', ')}`
          : "Discover recipes you'll love";

      res.json({
        recipes: validRecipes,
        count: validRecipes.length,
        message,
        preferences: preferenceNames,
      });
    } catch (error) {
      console.error('[For You] Error:', error);
      res.status(500).json({error: 'Failed to get personalized recipes'});
    }
  },
);

// Get recipes by match score (perfect matches first)
router.get(
  '/perfect-matches',
  authenticateToken,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      // Get user allergens
      const allergens = await AllergyModel.getAllUserTriggerIngredients(userId);
      const allAllergens = [
        ...allergens.severe,
        ...allergens.moderate,
        ...allergens.mild,
      ];

      // Get recipes
      const result = await pool.query(
        `SELECT * FROM recipe_cache 
       ORDER BY trending_score DESC, view_count DESC 
       LIMIT $1`,
        [limit * 3], // Get more for filtering
      );

      // Find recipes with NO conflicts
      const perfectMatches = [];

      for (const recipe of result.rows) {
        const ingredients = Array.isArray(recipe.ingredients)
          ? recipe.ingredients
          : [];
        let hasConflict = false;

        for (const ing of ingredients) {
          const name = ing.name.toLowerCase();
          if (
            allAllergens.some((a: string) => name.includes(a.toLowerCase()))
          ) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          perfectMatches.push({
            ...recipe,
            matchScore: 100,
            isSafe: true,
          });
        }

        if (perfectMatches.length >= limit) break;
      }

      res.json({
        recipes: perfectMatches,
        count: perfectMatches.length,
        message: 'Recipes that are 100% safe for you',
      });
    } catch (error) {
      console.error('[Perfect Matches] Error:', error);
      res.status(500).json({error: 'Failed to get perfect matches'});
    }
  },
);

export default router;
