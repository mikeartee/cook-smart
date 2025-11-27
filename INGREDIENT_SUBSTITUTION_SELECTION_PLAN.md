# Ingredient Substitution Selection - Implementation Plan

## 🎯 Goal
Allow users to select ingredient substitutions and add the selected alternatives to their shopping list instead of the original ingredient.

---

## 📋 Current Behavior

### What Works Now:
1. ✅ Recipe displays ingredients
2. ✅ System detects dietary restrictions/allergies
3. ✅ Shows substitution suggestions (up to 2)
4. ✅ "Add Missing to Shopping List" button exists

### What Doesn't Work:
1. ❌ Substitutions are just text (not selectable)
2. ❌ Original ingredient gets added to shopping list (even if user wants substitute)
3. ❌ No way to choose which substitute to use

---

## ✅ Desired Behavior

### User Flow:
1. User views recipe
2. Sees ingredient with ⚠️ warning (dietary/allergy conflict)
3. Sees 1-2 substitution suggestions
4. **Taps on a substitution to select it**
5. Selected substitution is highlighted/checked
6. Taps "Add Missing to Shopping List"
7. **Selected substitution** gets added (not original ingredient)

### Visual Design:
```
Original Ingredient (with warning):
❌ 2 cups milk
   ⚠️ Dietary restriction: dairy

   💡 Try instead:
   ☐ Almond milk (1:1 ratio)
   ☐ Oat milk (1:1 ratio)
```

After selection:
```
❌ 2 cups milk
   ⚠️ Dietary restriction: dairy

   💡 Try instead:
   ✅ Almond milk (1:1 ratio)  ← Selected!
   ☐ Oat milk (1:1 ratio)
```

---

## 🛠️ Implementation Plan

### Step 1: Add State for Selected Substitutions
**File**: `src/screens/recipes/RecipeDetailScreen.tsx`

Add state to track which substitutions are selected:
```typescript
const [selectedSubstitutions, setSelectedSubstitutions] = useState<{
  [ingredientIndex: number]: Substitution | null;
}>({});
```

### Step 2: Make Substitutions Tappable
Convert substitution text to TouchableOpacity buttons:

**Before** (current):
```typescript
<Text style={styles.substitutionText}>
  • {sub.substitute} ({sub.ratio})
</Text>
```

**After** (new):
```typescript
<TouchableOpacity
  style={[
    styles.substitutionButton,
    selectedSubstitutions[index]?.substitute === sub.substitute && 
    styles.substitutionButtonSelected
  ]}
  onPress={() => handleSelectSubstitution(index, sub)}
>
  <Icon 
    name={selectedSubstitutions[index]?.substitute === sub.substitute ? 
      'check-circle' : 'radio-button-unchecked'
    } 
    size={16} 
    color={selectedSubstitutions[index]?.substitute === sub.substitute ? 
      '#10B981' : '#9CA3AF'
    } 
  />
  <Text style={[
    styles.substitutionButtonText,
    selectedSubstitutions[index]?.substitute === sub.substitute && 
    styles.substitutionButtonTextSelected
  ]}>
    {sub.substitute} ({sub.ratio})
    {sub.notes ? ` - ${sub.notes}` : ''}
  </Text>
</TouchableOpacity>
```

### Step 3: Handle Substitution Selection
Add handler function:
```typescript
const handleSelectSubstitution = (ingredientIndex: number, substitution: Substitution) => {
  setSelectedSubstitutions(prev => ({
    ...prev,
    [ingredientIndex]: prev[ingredientIndex]?.substitute === substitution.substitute 
      ? null  // Deselect if already selected
      : substitution  // Select new substitution
  }));
};
```

### Step 4: Update Shopping List Logic
Modify `addMissingToShoppingList` to use selected substitutions:

**Current Logic**:
```typescript
recipe.ingredients.forEach(ing => {
  if (!hasIngredient(ing)) {
    const parsed = parseIngredient(ing);
    missingIngredients.push(parsed);
  }
});
```

**New Logic**:
```typescript
recipe.ingredients.forEach((ing, index) => {
  if (!hasIngredient(ing)) {
    const conflict = checkIngredientConflict(ing);
    
    // Check if user selected a substitution for this ingredient
    if (conflict.hasConflict && selectedSubstitutions[index]) {
      const sub = selectedSubstitutions[index];
      const parsed = parseIngredient(ing);
      
      // Calculate quantity based on substitution ratio
      const adjustedQuantity = calculateSubstitutionQuantity(
        parsed.quantity, 
        sub.ratio
      );
      
      missingIngredients.push({
        ingredient: sub.substitute,
        quantity: adjustedQuantity,
        unit: parsed.unit,
      });
    } else {
      // No substitution selected, add original ingredient
      const parsed = parseIngredient(ing);
      missingIngredients.push(parsed);
    }
  }
});
```

### Step 5: Add Ratio Calculation Helper
```typescript
const calculateSubstitutionQuantity = (
  originalQuantity: string, 
  ratio: string
): string => {
  // Parse ratio (e.g., "1:1", "3:4", "1.5:1")
  const ratioMatch = ratio.match(/([\d.]+):([\d.]+)/);
  if (!ratioMatch) return originalQuantity;
  
  const [_, numerator, denominator] = ratioMatch;
  const ratioValue = parseFloat(numerator) / parseFloat(denominator);
  
  // Parse original quantity
  const qtyNum = parseFloat(originalQuantity);
  if (isNaN(qtyNum)) return originalQuantity;
  
  // Calculate new quantity
  const newQty = qtyNum * ratioValue;
  return newQty.toString();
};
```

### Step 6: Add Visual Feedback
Show which substitutions are selected with:
- ✅ Checkmark icon
- Green background
- Bold text

### Step 7: Add Styles
```typescript
substitutionButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  padding: 8,
  backgroundColor: '#FFFFFF',
  borderRadius: 6,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  marginTop: 4,
},
substitutionButtonSelected: {
  backgroundColor: '#D1FAE5',
  borderColor: '#10B981',
},
substitutionButtonText: {
  flex: 1,
  fontSize: 11,
  color: '#374151',
  lineHeight: 16,
},
substitutionButtonTextSelected: {
  color: '#047857',
  fontWeight: '600',
},
```

---

## 🎨 Visual Design

### Before Selection:
```
┌─────────────────────────────────────┐
│ ❌ 2 cups milk                      │
│    ⚠️ Dietary restriction: dairy    │
│                                     │
│    💡 Try instead:                  │
│    ┌───────────────────────────┐   │
│    │ ○ Almond milk (1:1)       │   │
│    └───────────────────────────┘   │
│    ┌───────────────────────────┐   │
│    │ ○ Oat milk (1:1)          │   │
│    └───────────────────────────┘   │
└─────────────────────────────────────┘
```

### After Selection:
```
┌─────────────────────────────────────┐
│ ❌ 2 cups milk                      │
│    ⚠️ Dietary restriction: dairy    │
│                                     │
│    💡 Try instead:                  │
│    ┌───────────────────────────┐   │
│    │ ✅ Almond milk (1:1)      │ ← Green!
│    └───────────────────────────┘   │
│    ┌───────────────────────────┐   │
│    │ ○ Oat milk (1:1)          │   │
│    └───────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 📝 Implementation Checklist

### Phase 1: Basic Selection (30 minutes)
- [ ] Add `selectedSubstitutions` state
- [ ] Convert substitution text to TouchableOpacity
- [ ] Add `handleSelectSubstitution` function
- [ ] Add visual feedback (checkmark, colors)
- [ ] Add styles

### Phase 2: Shopping List Integration (30 minutes)
- [ ] Update `addMissingToShoppingList` logic
- [ ] Add `calculateSubstitutionQuantity` helper
- [ ] Test with different ratios (1:1, 3:4, etc.)
- [ ] Handle edge cases (no ratio, invalid ratio)

### Phase 3: Testing (20 minutes)
- [ ] Test selecting substitution
- [ ] Test deselecting substitution
- [ ] Test adding to shopping list with substitution
- [ ] Test adding to shopping list without substitution
- [ ] Test multiple ingredients with substitutions
- [ ] Verify quantities are calculated correctly

### Phase 4: Polish (10 minutes)
- [ ] Add haptic feedback on selection
- [ ] Add animation on selection
- [ ] Improve visual design
- [ ] Add "Clear all selections" option (optional)

---

## 🧪 Test Scenarios

### Test 1: Select Single Substitution
1. View recipe with dairy ingredient
2. See almond milk substitution
3. Tap almond milk
4. Verify checkmark appears
5. Add to shopping list
6. Verify almond milk is added (not dairy)

### Test 2: Change Selection
1. Select almond milk
2. Change mind, select oat milk
3. Verify only oat milk is selected
4. Add to shopping list
5. Verify oat milk is added

### Test 3: Deselect Substitution
1. Select almond milk
2. Tap again to deselect
3. Verify no checkmark
4. Add to shopping list
5. Verify original ingredient is added

### Test 4: Multiple Ingredients
1. Recipe has 3 ingredients with conflicts
2. Select substitutions for 2 of them
3. Leave 1 without selection
4. Add to shopping list
5. Verify:
   - 2 substitutions added
   - 1 original ingredient added

### Test 5: Ratio Calculation
1. Ingredient: "2 cups milk"
2. Substitution: "Coconut milk (3:4 ratio)"
3. Select substitution
4. Add to shopping list
5. Verify: "1.5 cups coconut milk" is added

---

## 💡 Future Enhancements (Optional)

### Enhancement 1: Remember Preferences
Save user's substitution preferences:
- User always chooses almond milk for dairy
- Next time, auto-select almond milk

### Enhancement 2: Custom Substitutions
Allow users to add their own substitutions:
- "I prefer cashew milk instead"
- Save to user profile

### Enhancement 3: Substitution Notes
Show more details about substitutions:
- Taste differences
- Cooking behavior
- Nutritional comparison

### Enhancement 4: Bulk Selection
Add "Use all recommended substitutions" button:
- One tap to select all
- Saves time for users with multiple restrictions

---

## 🎯 Success Criteria

### Must Have:
- ✅ User can tap to select substitution
- ✅ Visual feedback shows selection
- ✅ Selected substitution added to shopping list
- ✅ Quantity calculated correctly based on ratio

### Should Have:
- ✅ Can deselect substitution
- ✅ Can change selection
- ✅ Works with multiple ingredients
- ✅ Handles edge cases gracefully

### Nice to Have:
- ✅ Haptic feedback
- ✅ Smooth animations
- ✅ Remember preferences
- ✅ Custom substitutions

---

## 📊 Estimated Time

- **Implementation**: 1-1.5 hours
- **Testing**: 30 minutes
- **Polish**: 15 minutes
- **Total**: ~2 hours

---

## 🚀 Ready to Implement?

This feature will make the dietary/allergy system much more useful! Users can actually choose their preferred substitutions and have them automatically added to their shopping list.

**Want me to implement this now or add it to the weekend testing plan?**

