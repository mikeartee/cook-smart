import express from 'express';
import {authenticateToken, AuthRequest} from '../middleware/auth';
import RecipeCacheService from '../services/RecipeCacheService';
import {AllergyModel} from '../models/Allergy';

const router = express.Router();

interface SafetyWarning {
  ingredient: string;
  allergy: string;
  severity: string;
  message: string;
  recommendation: string;
  crossReactive: boolean;
}

// Check recipe for cross-contamination and safety issues
router.get(
  '/:id',
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

      // Get user allergies with cross-reactive ingredients
      const allergies = await AllergyModel.getUserAllergies(userId);

      const warnings: SafetyWarning[] = [];
      const ingredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : [];

      // Check each ingredient
      ingredients.forEach((ing: any) => {
        const ingName = ing.name.toLowerCase();

        allergies.forEach(allergy => {
          // Check direct triggers
          const isDirectTrigger = allergy.trigger_ingredients.some(
            (trigger: string) => ingName.includes(trigger.toLowerCase()),
          );

          if (isDirectTrigger) {
            warnings.push({
              ingredient: ing.name,
              allergy: allergy.name,
              severity: allergy.severity_override || allergy.severity,
              message: `Contains ${allergy.name} allergen`,
              recommendation: getSeverityRecommendation(
                allergy.severity_override || allergy.severity,
              ),
              crossReactive: false,
            });
          }

          // Check cross-reactive ingredients
          const isCrossReactive = allergy.cross_reactive_ingredients.some(
            (cr: string) => ingName.includes(cr.toLowerCase()),
          );

          if (isCrossReactive && !isDirectTrigger) {
            warnings.push({
              ingredient: ing.name,
              allergy: allergy.name,
              severity: allergy.severity_override || allergy.severity,
              message: `May cross-react with ${allergy.name}`,
              recommendation: 'Proceed with caution or consult allergist',
              crossReactive: true,
            });
          }
        });
      });

      // Sort warnings by severity
      const severityOrder = {severe: 0, moderate: 1, mild: 2};
      warnings.sort((a, b) => {
        const severityA =
          severityOrder[a.severity as keyof typeof severityOrder] ?? 3;
        const severityB =
          severityOrder[b.severity as keyof typeof severityOrder] ?? 3;
        return severityA - severityB;
      });

      // Calculate overall safety level
      const hasSevere = warnings.some(w => w.severity === 'severe');
      const hasModerate = warnings.some(w => w.severity === 'moderate');
      const hasCrossReactive = warnings.some(w => w.crossReactive);

      let safetyLevel: 'safe' | 'caution' | 'warning' | 'danger';
      if (hasSevere) {
        safetyLevel = 'danger';
      } else if (hasModerate) {
        safetyLevel = 'warning';
      } else if (hasCrossReactive) {
        safetyLevel = 'caution';
      } else if (warnings.length > 0) {
        safetyLevel = 'caution';
      } else {
        safetyLevel = 'safe';
      }

      res.json({
        recipeId,
        warnings,
        warningCount: warnings.length,
        safetyLevel,
        isSafe: warnings.length === 0,
        hasCrossReactiveWarnings: hasCrossReactive,
        summary: generateSafetySummary(warnings, safetyLevel),
      });
    } catch (error) {
      console.error('[Safety Check] Error:', error);
      res.status(500).json({error: 'Failed to perform safety check'});
    }
  },
);

// Get safety information for user's allergies
router.get(
  '/my-allergies',
  authenticateToken,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      const allergies = await AllergyModel.getUserAllergies(userId);

      const allergyInfo = allergies.map(allergy => ({
        name: allergy.name,
        severity: allergy.severity_override || allergy.severity,
        description: allergy.description,
        triggerIngredients: allergy.trigger_ingredients,
        crossReactiveIngredients: allergy.cross_reactive_ingredients,
        customNotes: allergy.custom_notes,
      }));

      res.json({
        allergies: allergyInfo,
        count: allergyInfo.length,
      });
    } catch (error) {
      console.error('[Allergy Info] Error:', error);
      res.status(500).json({error: 'Failed to get allergy information'});
    }
  },
);

// Helper functions
function getSeverityRecommendation(severity: string): string {
  switch (severity) {
    case 'severe':
      return 'DO NOT CONSUME - Life-threatening risk';
    case 'moderate':
      return 'Avoid consumption - May cause significant discomfort';
    case 'mild':
      return 'Use caution - May cause minor symptoms';
    default:
      return 'Consult with healthcare provider';
  }
}

function generateSafetySummary(
  warnings: SafetyWarning[],
  _safetyLevel: string,
): string {
  if (warnings.length === 0) {
    return '✅ This recipe is safe for you based on your allergy profile';
  }

  const severeCount = warnings.filter(w => w.severity === 'severe').length;
  const moderateCount = warnings.filter(w => w.severity === 'moderate').length;
  const mildCount = warnings.filter(w => w.severity === 'mild').length;
  const crossReactiveCount = warnings.filter(w => w.crossReactive).length;

  const parts = [];

  if (severeCount > 0) {
    parts.push(`🔴 ${severeCount} SEVERE allergen(s)`);
  }
  if (moderateCount > 0) {
    parts.push(`🟡 ${moderateCount} MODERATE allergen(s)`);
  }
  if (mildCount > 0) {
    parts.push(`🟢 ${mildCount} MILD allergen(s)`);
  }
  if (crossReactiveCount > 0) {
    parts.push(`⚠️ ${crossReactiveCount} cross-reactive ingredient(s)`);
  }

  return parts.join(', ');
}

export default router;
