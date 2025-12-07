import express from 'express';
import {authenticateToken, AuthRequest} from '../middleware/auth';
import RecipeCacheService from '../services/RecipeCacheService';
import {AllergyModel} from '../models/Allergy';
import {DietaryRestrictionModel} from '../models/DietaryRestriction';
import {IngredientSubstitutionService} from '../services/IngredientSubstitutionService';

const router = express.Router();

interface ConflictAnalysis {
  severe: string[];
  moderate: string[];
  mild: string[];
  dietary: string[];
}

interface RecipeAnalysis {
  recipeId: string;
  conflicts: ConflictAnalysis;
  substitutions: any[];
  isSafe: boolean;
  canBeModified: boolean;
  safetyScore: number;
}

// Analyze a single recipe for conflicts and substitutions
router.get(
  '/:id/analysis',
  authenticateToken,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user?.id;
      const recipeId = req.params.id;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      // Get recipe
      const recipe = await RecipeCacheService.getRecipeById(recipeId);
      if (!recipe) {
        res.status(404).json({error: 'Recipe not found'});
        return;
      }

      // Get user's allergens and dietary restrictions
      const [triggers, excluded] = await Promise.all([
        AllergyModel.getAllUserTriggerIngredients(userId),
        DietaryRestrictionModel.getAllUserExcludedIngredients(userId),
      ]);

      // Analyze conflicts
      const conflicts: ConflictAnalysis = {
        severe: [],
        moderate: [],
        mild: [],
        dietary: [],
      };

      const ingredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : [];

      ingredients.forEach((ing: any) => {
        const name = ing.name.toLowerCase();

        // Check allergies by severity
        if (
          triggers.severe.some((t: string) => name.includes(t.toLowerCase()))
        ) {
          conflicts.severe.push(ing.name);
        } else if (
          triggers.moderate.some((t: string) => name.includes(t.toLowerCase()))
        ) {
          conflicts.moderate.push(ing.name);
        } else if (
          triggers.mild.some((t: string) => name.includes(t.toLowerCase()))
        ) {
          conflicts.mild.push(ing.name);
        }

        // Check dietary restrictions
        if (excluded.some((e: string) => name.includes(e.toLowerCase()))) {
          conflicts.dietary.push(ing.name);
        }
      });

      // Get substitutions for ALL conflicts
      const allConflicts = [
        ...conflicts.severe,
        ...conflicts.moderate,
        ...conflicts.mild,
        ...conflicts.dietary,
      ];

      const substitutions = IngredientSubstitutionService.getSubstitutions(
        allConflicts,
        conflicts.severe.length > 0 ? 'allergy' : 'dietary',
      );

      // Calculate safety score (0-100)
      const totalIngredients = ingredients.length;
      const conflictCount = allConflicts.length;
      const safetyScore =
        totalIngredients > 0
          ? Math.round(
              ((totalIngredients - conflictCount) / totalIngredients) * 100,
            )
          : 100;

      const analysis: RecipeAnalysis = {
        recipeId,
        conflicts,
        substitutions,
        isSafe: allConflicts.length === 0,
        canBeModified: substitutions.length > 0,
        safetyScore,
      };

      res.json(analysis);
    } catch (error) {
      console.error('[Recipe Analysis] Error:', error);
      res.status(500).json({error: 'Failed to analyze recipe'});
    }
  },
);

// Batch analyze multiple recipes (for recipe list views)
router.post(
  '/batch-analysis',
  authenticateToken,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user?.id;
      const {recipeIds} = req.body;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
        res.status(400).json({error: 'recipeIds array is required'});
        return;
      }

      // Get user's allergens and dietary restrictions once
      const [triggers, excluded] = await Promise.all([
        AllergyModel.getAllUserTriggerIngredients(userId),
        DietaryRestrictionModel.getAllUserExcludedIngredients(userId),
      ]);

      // Analyze each recipe
      const analyses = await Promise.all(
        recipeIds.map(async (recipeId: string) => {
          try {
            const recipe = await RecipeCacheService.getRecipeById(recipeId);
            if (!recipe) {
              return null;
            }

            const conflicts: ConflictAnalysis = {
              severe: [],
              moderate: [],
              mild: [],
              dietary: [],
            };

            const ingredients = Array.isArray(recipe.ingredients)
              ? recipe.ingredients
              : [];

            ingredients.forEach((ing: any) => {
              const name = ing.name.toLowerCase();

              if (
                triggers.severe.some((t: string) =>
                  name.includes(t.toLowerCase()),
                )
              ) {
                conflicts.severe.push(ing.name);
              } else if (
                triggers.moderate.some((t: string) =>
                  name.includes(t.toLowerCase()),
                )
              ) {
                conflicts.moderate.push(ing.name);
              } else if (
                triggers.mild.some((t: string) =>
                  name.includes(t.toLowerCase()),
                )
              ) {
                conflicts.mild.push(ing.name);
              }

              if (
                excluded.some((e: string) => name.includes(e.toLowerCase()))
              ) {
                conflicts.dietary.push(ing.name);
              }
            });

            const allConflicts = [
              ...conflicts.severe,
              ...conflicts.moderate,
              ...conflicts.mild,
              ...conflicts.dietary,
            ];

            const substitutions =
              IngredientSubstitutionService.getSubstitutions(
                allConflicts,
                conflicts.severe.length > 0 ? 'allergy' : 'dietary',
              );

            const totalIngredients = ingredients.length;
            const conflictCount = allConflicts.length;
            const safetyScore =
              totalIngredients > 0
                ? Math.round(
                    ((totalIngredients - conflictCount) / totalIngredients) *
                      100,
                  )
                : 100;

            return {
              recipeId,
              conflicts,
              substitutionCount: substitutions.length,
              isSafe: allConflicts.length === 0,
              canBeModified: substitutions.length > 0,
              safetyScore,
            };
          } catch (error) {
            console.error(
              `[Batch Analysis] Error analyzing recipe ${recipeId}:`,
              error,
            );
            return null;
          }
        }),
      );

      // Filter out null results
      const validAnalyses = analyses.filter(a => a !== null);

      res.json({
        analyses: validAnalyses,
        count: validAnalyses.length,
      });
    } catch (error) {
      console.error('[Batch Analysis] Error:', error);
      res.status(500).json({error: 'Failed to analyze recipes'});
    }
  },
);

export default router;
