# Cook Smart - Fixes Log

## Database Model Pattern (Fixed 2024-11-13)

**Problem**: New models used Knex syntax but existing codebase uses raw PostgreSQL queries via `pool.query()`

**Solution**: 
- Use `import pool from '../config/database'` 
- Use `pool.query(sql, params)` for all database operations
- Parse JSON fields manually: `JSON.parse(row.field || '[]')`
- Return `result.rows` from queries

**Working Example**:
```typescript
static async getAll(): Promise<any[]> {
  const query = 'SELECT * FROM table WHERE active = true';
  const result = await pool.query(query);
  return result.rows.map(row => ({
    ...row,
    json_field: JSON.parse(row.json_field || '[]')
  }));
}
```

**Test Status**: ✅ Verified with mocked database - all methods work correctly

## Testing Pattern (Established 2024-11-13)

**Approach**: 
1. Create minimal test with mocked dependencies
2. Verify core logic works before database integration  
3. Test compilation separately from runtime
4. Clean up all test files after verification

**Working Mock Pattern**:
```javascript
const mockPool = {
  query: async (query, params) => {
    // Return appropriate test data based on query
    return { rows: [...] };
  }
};
```
# Cook Smart - Fixes & Solutions Log

## Database Model Pattern (PROVEN ✅)
**Issue**: Mismatch between Knex-based and raw SQL patterns
**Solution**: Use PostgreSQL pool.query() with raw SQL
```typescript
import pool from '../config/database';
export class ModelName {
  static async method(): Promise<any[]> {
    const query = 'SELECT * FROM table';
    const result = await pool.query(query);
    return result.rows;
  }
}
```

## Testing Approach (PROVEN ✅)
**Issue**: Items marked complete without testing
**Solution**: Test-first methodology
1. Create service/model with TypeScript
2. Test compilation: `npx tsc --noEmit file.ts`
3. Create minimal functionality test
4. Clean up test files
5. Mark complete only after successful testing

## Recipe Filter Service (PROVEN ✅)
**Issue**: Need to analyze recipes for dietary conflicts
**Solution**: RecipeFilterService with analyzeRecipe() and filterRecipes()
- Uses existing DietaryRestrictionModel and AllergyModel
- Returns structured conflicts with type, restriction name, and conflicting ingredients
- Handles severity-based allergy triggers (severe, moderate, mild)
- Compiles successfully and has correct structure

## Key Principles
- NEVER mark items complete without testing
- Use established database patterns (pool.query)
- Clean up test files after verification
- Document successful solutions for reuse


## Fix: Ingredient Deletion Not Working (Nov 19, 2024)

**Problem**: Users unable to delete ingredients from inventory in the app.

**Root Cause**: 
Two issues found:
1. Frontend was passing `user_ingredients.id` (the primary key) to the delete endpoint, but backend's `removeUserIngredient` method was expecting `ingredient_id` in the WHERE clause
2. The `GET /api/v1/ingredients` endpoint was returning mock data instead of the user's actual pantry ingredients from the database

**Solution**:
1. Changed `backend/src/models/Ingredient.ts` method `removeUserIngredient`:
```typescript
// Before:
DELETE FROM user_ingredients WHERE user_id = $1 AND ingredient_id = $2

// After:
DELETE FROM user_ingredients WHERE user_id = $1 AND id = $2
```

2. Fixed `GET /api/v1/ingredients` endpoint in `backend/src/routes/ingredients.ts`:
```typescript
// Before: Returned mock data without authentication
// After: Returns user's actual pantry ingredients with authentication
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const ingredients = await IngredientModel.getUserIngredients(req.user.id);
  res.json({ ingredients });
});
```

**Files Modified**:
- `backend/src/models/Ingredient.ts` - Updated `removeUserIngredient` to use `id` instead of `ingredient_id`
- `backend/src/routes/ingredients.ts` - Fixed GET endpoint to return user's pantry ingredients

**Testing Required**:
1. Restart backend server ✅
2. Test fetching ingredients - should show user's actual pantry
3. Test deleting an ingredient from the app inventory
4. Verify ingredient is removed from the list

**Success Rate**: New fix - pending verification
