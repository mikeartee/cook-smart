# Allergy & Dietary Enhancements - Implementation Plan

**Date**: December 6, 2025  
**Philosophy**: Empower users with substitutions, don't limit their options

## Core Principle ✨

**Show recipes WITH substitutions, not hide them**

Instead of excluding recipes with allergens, we:
1. Show ALL recipes
2. Highlight conflicts with severity
3. Suggest substitutions automatically
4. Let users decide if they want to try it

**Why This Is Better**:
- Users discover recipes they thought were off-limits
- Builds confidence in cooking with restrictions
- Expands their recipe repertoire
- More empowering than restrictive

## Features to Implement

### 1. Visual Severity Indicators 🚦
**Show allergy severity with color coding**

**Recipe Card Display**:
```
┌─────────────────────────────────┐
│ 🍝 Creamy Pasta Alfredo         │
│                                 │
│ 🔴 SEVERE: Contains peanuts     │
│ 🟡 MODERATE: Contains dairy     │
│                                 │
│ ✅ 2 substitutions available    │
└─────────────────────────────────┘
```

**Implementation**:
```typescript
// New endpoint: GET /api/v1/recipes/:id/analysis
router.get('/:id/analysis', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const recipeId = req.params.id;
  
  // Get recipe
  const recipe = await RecipeCacheService.getRecipeById(recipeId);
  
  // Analyze with severity
  const triggers = await AllergyModel.getAllUserTriggerIngredients(userId);
  const excluded = await DietaryRestrictionModel.getAllUserExcludedIngredients(userId);
  
  const conflicts = {
    severe: [],
    moderate: [],
    mild: [],
    dietary: []
  };
  
  recipe.ingredients.forEach(ing => {
    const name = ing.name.toLowerCase();
    
    // Check allergies by severity
    if (triggers.severe.some(t => name.includes(t))) {
      conflicts.severe.push(ing.name);
    } else if (triggers.moderate.some(t => name.includes(t))) {
      conflicts.moderate.push(ing.name);
    } else if (triggers.mild.some(t => name.includes(t))) {
      conflicts.mild.push(ing.name);
    }
    
    // Check dietary restrictions
    if (excluded.some(e => name.includes(e))) {
      conflicts.dietary.push(ing.name);
    }
  });
  
  // Get substitutions for ALL conflicts
  const allConflicts = [
    ...conflicts.severe,
    ...conflicts.moderate,
    ...conflicts.mild,
    ...conflicts.dietary
  ];
  
  const substitutions = IngredientSubstitutionService.getSubstitutions(
    allConflicts,
    conflicts.severe.length > 0 ? 'allergy' : 'dietary'
  );
  
  res.json({
    recipeId,
    conflicts,
    substitutions,
    isSafe: allConflicts.length === 0,
    canBeModified: substitutions.length > 0
  });
});
```

**Frontend Display**:
```typescript
// Recipe card component
{analysis.conflicts.severe.length > 0 && (
  <Badge color="red" icon="⚠️">
    SEVERE: {analysis.conflicts.severe.join(', ')}
  </Badge>
)}

{analysis.conflicts.moderate.length > 0 && (
  <Badge color="yellow" icon="⚠️">
    MODERATE: {analysis.conflicts.moderate.join(', ')}
  </Badge>
)}

{analysis.substitutions.length > 0 && (
  <Badge color="green" icon="✅">
    {analysis.substitutions.length} substitutions available
  </Badge>
)}
```

### 2. Auto-Substitution View 🔄
**Show recipe with substitutions already applied**

**Recipe Detail Page**:
```
Original Recipe          →    Your Modified Recipe
─────────────────────────────────────────────────
1 cup milk              →    1 cup almond milk
2 eggs                  →    2 flax eggs (2 tbsp flax + 6 tbsp water)
1/2 cup peanut butter   →    1/2 cup sunflower seed butter
```

**Implementation**:
```typescript
// New endpoint: GET /api/v1/recipes/:id/modified
router.get('/:id/modified', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const recipeId = req.params.id;
  
  // Get recipe and analysis
  const recipe = await RecipeCacheService.getRecipeById(recipeId);
  const analysis = await RecipeFilterService.analyzeRecipe(
    userId,
    recipe.ingredients.map(i => i.name)
  );
  
  // Get substitutions
  const allConflicts = analysis.conflicts.flatMap(c => c.conflictingIngredients);
  const substitutions = IngredientSubstitutionService.getSubstitutions(
    allConflicts,
    analysis.conflicts[0]?.type || 'dietary'
  );
  
  // Apply substitutions to ingredients
  const modifiedIngredients = recipe.ingredients.map(ing => {
    const sub = substitutions.find(s => 
      ing.name.toLowerCase().includes(s.original.toLowerCase())
    );
    
    if (sub && sub.substitutes.length > 0) {
      const bestSub = sub.substitutes[0];
      return {
        original: ing,
        modified: {
          name: bestSub.ingredient,
          amount: ing.amount * parseRatio(bestSub.ratio),
          unit: ing.unit
        },
        substitution: bestSub,
        hasSubstitution: true
      };
    }
    
    return {
      original: ing,
      modified: ing,
      hasSubstitution: false
    };
  });
  
  res.json({
    recipe: {
      ...recipe,
      ingredients: modifiedIngredients
    },
    modifications: {
      count: substitutions.length,
      difficulty: calculateDifficulty(substitutions),
      notes: generateNotes(substitutions)
    }
  });
});

function parseRatio(ratio: string): number {
  // "1:1" = 1, "3:4" = 0.75, etc.
  const [num, denom] = ratio.split(':').map(Number);
  return num / denom;
}
```

**Frontend Toggle**:
```typescript
<Toggle>
  <Option value="original">Original Recipe</Option>
  <Option value="modified">With Your Substitutions</Option>
</Toggle>

{view === 'modified' && (
  <Alert type="info">
    This recipe has been modified to match your dietary preferences.
    Difficulty increase: {modifications.difficulty}
  </Alert>
)}
```

### 3. Smart Recipe Recommendations 🎯
**Personalized feed based on preferences**

**Implementation**:
```typescript
// New endpoint: GET /api/v1/recipes/for-you
router.get('/for-you', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const limit = parseInt(req.query.limit as string) || 20;
  
  // Get user preferences
  const restrictions = await DietaryRestrictionModel.getUserRestrictions(userId);
  const allergens = await AllergyModel.getAllUserTriggerIngredients(userId);
  
  // Build search criteria based on preferences
  const searchCriteria = [];
  
  // If vegetarian, prioritize vegetarian recipes
  if (restrictions.some(r => r.name === 'Vegetarian')) {
    searchCriteria.push({ recipeTypes: 'vegetarian', weight: 2 });
  }
  
  // If vegan, prioritize vegan recipes
  if (restrictions.some(r => r.name === 'Vegan')) {
    searchCriteria.push({ recipeTypes: 'vegan', weight: 3 });
  }
  
  // If gluten-free, prioritize gluten-free recipes
  if (restrictions.some(r => r.name.includes('Gluten'))) {
    searchCriteria.push({ recipeTypes: 'gluten-free', weight: 2 });
  }
  
  // Get recipes from cache that match preferences
  const recipes = await pool.query(`
    SELECT *, 
      CASE 
        WHEN dietary_info->>'vegetarian' = 'true' THEN 2
        WHEN dietary_info->>'vegan' = 'true' THEN 3
        WHEN dietary_info->>'glutenFree' = 'true' THEN 2
        ELSE 1
      END as preference_score
    FROM recipe_cache
    ORDER BY preference_score DESC, trending_score DESC, view_count DESC
    LIMIT $1
  `, [limit]);
  
  // Analyze each recipe for conflicts and substitutions
  const analyzed = await Promise.all(
    recipes.rows.map(async recipe => {
      const conflicts = await analyzeRecipeConflicts(userId, recipe);
      const substitutions = getSubstitutionsForRecipe(conflicts);
      
      return {
        ...recipe,
        conflicts,
        substitutions,
        canBeModified: substitutions.length > 0,
        matchScore: calculateMatchScore(recipe, restrictions)
      };
    })
  );
  
  res.json({
    recipes: analyzed,
    message: 'Recipes personalized for your dietary preferences'
  });
});
```

**Frontend Display**:
```
┌─────────────────────────────────────────┐
│ 🌟 Recipes For You                      │
│                                         │
│ Based on: Vegetarian, Gluten-Free      │
├─────────────────────────────────────────┤
│                                         │
│ 🥗 Quinoa Buddha Bowl                   │
│ ✅ Perfect match - no modifications     │
│ ⭐⭐⭐⭐⭐ 95% match                      │
│                                         │
│ 🍝 Creamy Pasta Alfredo                 │
│ 🟡 Contains dairy                       │
│ ✅ 2 substitutions available            │
│ ⭐⭐⭐⭐ 80% match                        │
│                                         │
└─────────────────────────────────────────┘
```

### 4. Substitution Confidence & Feedback 📊
**Learn which substitutions work best**

**Implementation**:
```typescript
// Database table
CREATE TABLE substitution_feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  recipe_id VARCHAR(255),
  original_ingredient VARCHAR(255),
  substitute_ingredient VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  worked BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Endpoint: POST /api/v1/substitutions/feedback
router.post('/feedback', authenticateToken, async (req: AuthRequest, res) => {
  const { recipeId, original, substitute, rating, worked, notes } = req.body;
  
  await pool.query(
    `INSERT INTO substitution_feedback 
     (user_id, recipe_id, original_ingredient, substitute_ingredient, rating, worked, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [req.user.id, recipeId, original, substitute, rating, worked, notes]
  );
  
  res.json({ success: true });
});

// Endpoint: GET /api/v1/substitutions/:original/stats
router.get('/:original/stats', async (req, res) => {
  const { original } = req.params;
  
  const stats = await pool.query(`
    SELECT 
      substitute_ingredient,
      COUNT(*) as usage_count,
      AVG(rating) as avg_rating,
      COUNT(CASE WHEN worked = true THEN 1 END)::float / COUNT(*) as success_rate
    FROM substitution_feedback
    WHERE original_ingredient = $1
    GROUP BY substitute_ingredient
    ORDER BY success_rate DESC, avg_rating DESC
  `, [original]);
  
  res.json({ substitutes: stats.rows });
});
```

**Enhanced Substitution Display**:
```
Original: 1 cup milk

Substitutions:
┌────────────────────────────────────────┐
│ 🥇 Oat milk (1:1)                      │
│    ⭐⭐⭐⭐⭐ 4.8/5 (127 users)          │
│    ✅ 94% success rate                 │
│    💡 Best for baking and cooking      │
├────────────────────────────────────────┤
│ 🥈 Almond milk (1:1)                   │
│    ⭐⭐⭐⭐ 4.2/5 (89 users)            │
│    ✅ 87% success rate                 │
│    💡 Slightly nutty flavor            │
├────────────────────────────────────────┤
│ 🥉 Coconut milk (1:1)                  │
│    ⭐⭐⭐ 3.9/5 (56 users)              │
│    ✅ 78% success rate                 │
│    💡 Adds coconut flavor              │
└────────────────────────────────────────┘
```

### 5. Cross-Contamination Warnings ⚠️
**Surface existing cross-reactive data**

**Implementation**:
```typescript
// Enhance recipe analysis to include cross-reactivity
router.get('/:id/safety-check', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const recipeId = req.params.id;
  
  const recipe = await RecipeCacheService.getRecipeById(recipeId);
  const allergies = await AllergyModel.getUserAllergies(userId);
  
  const warnings = [];
  
  recipe.ingredients.forEach(ing => {
    allergies.forEach(allergy => {
      // Check cross-reactive ingredients
      const crossReactive = allergy.cross_reactive_ingredients.some(cr =>
        ing.name.toLowerCase().includes(cr.toLowerCase())
      );
      
      if (crossReactive) {
        warnings.push({
          ingredient: ing.name,
          allergy: allergy.name,
          severity: allergy.severity,
          message: `May cross-react with ${allergy.name}`,
          recommendation: 'Proceed with caution or consult allergist'
        });
      }
    });
  });
  
  res.json({
    recipeId,
    warnings,
    isSafe: warnings.length === 0
  });
});
```

**Frontend Display**:
```
⚠️ Cross-Contamination Warning

This recipe contains almonds.
You're allergic to peanuts, which can cross-react with tree nuts.

Severity: MODERATE
Recommendation: Proceed with caution

[ Learn More ] [ Skip Recipe ] [ Cook Anyway ]
```

## Implementation Timeline

### Week 1: Visual Indicators
- ✅ Severity badges on recipe cards
- ✅ Conflict analysis endpoint
- ✅ Frontend badge components

### Week 2: Auto-Substitution View
- ✅ Modified recipe endpoint
- ✅ Ingredient substitution logic
- ✅ Toggle between original/modified view

### Week 3: Smart Recommendations
- ✅ "For You" feed endpoint
- ✅ Preference-based scoring
- ✅ Match percentage calculation

### Week 4: Feedback System
- ✅ Substitution feedback database
- ✅ Feedback collection UI
- ✅ Success rate display

### Week 5: Cross-Contamination
- ✅ Safety check endpoint
- ✅ Warning display UI
- ✅ Educational content

## Database Migrations Needed

```sql
-- Substitution feedback table
CREATE TABLE substitution_feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  recipe_id VARCHAR(255),
  original_ingredient VARCHAR(255),
  substitute_ingredient VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  worked BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_substitution_feedback_original ON substitution_feedback(original_ingredient);
CREATE INDEX idx_substitution_feedback_user ON substitution_feedback(user_id);
```

## Success Metrics

**User Engagement**:
- % of users who try modified recipes
- Average rating of substitutions
- Number of recipes saved with modifications

**Safety**:
- Reduction in allergy-related issues
- User confidence scores
- Cross-contamination awareness

**Discovery**:
- New recipes tried per user
- Recipe variety increase
- Substitution adoption rate

## Conclusion

This approach is **empowering, not restrictive**:
- Users see ALL recipes
- Clear warnings about conflicts
- Automatic substitution suggestions
- Community-validated alternatives
- Educational about cross-reactivity

**Philosophy**: "You CAN eat this, here's how" instead of "You CAN'T eat this"

This builds confidence and expands options rather than limiting them! 🚀
