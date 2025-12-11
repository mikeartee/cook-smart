import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useRecipes} from '../../contexts/RecipeContext';
import {useIngredients} from '../../contexts/IngredientContext';
import {useAuth} from '../../contexts/AuthContext';
import {RecipeDetails} from '../../services/recipeService';
import {shoppingListService} from '../../services/shoppingListService';
import {dietaryService} from '../../services/dietaryService';
import {
  findSubstitutions,
  Substitution,
} from '../../utils/ingredientSubstitutions';
import {
  rateRecipe,
  getRecipeRatings,
  markRecipeCooked,
} from '../../services/recipeEnhancementService';
import RecipeSocialActions from '../../components/RecipeSocialActions';
import RecipeComments from '../../components/RecipeComments';
import {NutritionFacts} from '../../components/NutritionFacts';
import {RecipeImage} from '../../components/RecipeImage';

interface RecipeDetailScreenProps {
  route: any;
  navigation: any;
}

export const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const {recipeId} = route.params;
  const {getRecipeDetails, saveRecipe, isRecipeSaved, deleteSavedRecipe} =
    useRecipes();
  const {ingredients} = useIngredients();
  const {user} = useAuth();

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servings, setServings] = useState<number>(1);
  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [allergyTriggers, setAllergyTriggers] = useState<{
    severe: string[];
    moderate: string[];
    mild: string[];
  }>({severe: [], moderate: [], mild: []});
  const [selectedSubstitutions, setSelectedSubstitutions] = useState<{
    [ingredientIndex: number]: Substitution | null;
  }>({});
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    loadRecipe();
    checkIfSaved();
    loadUserIngredients();
    loadDietaryRestrictions();
    loadRatings();
  }, [recipeId]);

  const loadRatings = async () => {
    try {
      const data = await getRecipeRatings(recipeId, 'api');
      setAvgRating(parseFloat(data.ratings.avg_rating) || 0);
      setTotalRatings(parseInt(data.ratings.total_ratings) || 0);
    } catch (_err) {
      console.error('Error loading ratings:', _err);
    }
  };

  const handleRate = async (rating: number) => {
    try {
      await rateRecipe(recipeId, 'api', rating);
      setUserRating(rating);
      await loadRatings();
      Alert.alert('Success', 'Rating saved!');
    } catch (_err) {
      Alert.alert('Error', 'Failed to save rating');
    }
  };

  const handleAddToShoppingList = async () => {
    if (!recipe) return;

    try {
      Alert.alert(
        'Add to Shopping List',
        `Add all ${recipe.ingredients.length} ingredients to your shopping list?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Add',
            onPress: async () => {
              try {
                await shoppingListService.addRecipeToShoppingList(
                  recipe.id,
                  recipe.ingredients,
                  servings,
                );
                Alert.alert(
                  'Success',
                  'Ingredients added to your shopping list!',
                );
              } catch (_err) {
                Alert.alert(
                  'Error',
                  'Failed to add ingredients to shopping list',
                );
              }
            },
          },
        ],
      );
    } catch (err) {
      console.error('Error adding to shopping list:', err);
    }
  };

  const handleCookThis = async () => {
    Alert.alert('Cook This Recipe', 'Mark this recipe as cooked?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Yes, I Cooked It!',
        onPress: async () => {
          try {
            await markRecipeCooked(recipeId, 'api', userRating || undefined);
            Alert.alert(
              '🎉 Great Job!',
              'Recipe marked as cooked! Keep cooking!',
            );
          } catch (_err) {
            Alert.alert('Error', 'Failed to mark recipe as cooked');
          }
        },
      },
    ]);
  };

  const loadDietaryRestrictions = async () => {
    if (!user?.id) return;

    try {
      const [restrictions, allergies] = await Promise.all([
        dietaryService.getUserRestrictions(user.id),
        dietaryService.getUserAllergies(user.id),
      ]);

      // Collect all excluded ingredients from dietary restrictions
      const excluded: string[] = [];
      restrictions.forEach(r => {
        if (r.excluded_ingredients && Array.isArray(r.excluded_ingredients)) {
          excluded.push(
            ...r.excluded_ingredients.map((i: string) => i.toLowerCase()),
          );
        }
      });
      setExcludedIngredients(excluded);

      // Collect allergy triggers by severity
      const triggers = {
        severe: [] as string[],
        moderate: [] as string[],
        mild: [] as string[],
      };
      allergies.forEach((a: any) => {
        const severity = (a.severity_override || a.severity) as
          | 'severe'
          | 'moderate'
          | 'mild';
        if (a.trigger_ingredients && Array.isArray(a.trigger_ingredients)) {
          triggers[severity].push(
            ...a.trigger_ingredients.map((i: string) => i.toLowerCase()),
          );
        }
        if (
          a.cross_reactive_ingredients &&
          Array.isArray(a.cross_reactive_ingredients)
        ) {
          triggers[severity].push(
            ...a.cross_reactive_ingredients.map((i: string) => i.toLowerCase()),
          );
        }
      });
      setAllergyTriggers(triggers);
    } catch (err) {
      console.error('Error loading dietary restrictions:', err);
    }
  };

  const loadUserIngredients = () => {
    // Extract ingredient names from user's pantry
    const ingredientNames = ingredients
      .filter(ing => ing.name)
      .map(ing => ing.name!.toLowerCase().trim());
    setUserIngredients(ingredientNames);
  };

  const checkIngredientConflict = (
    ingredientName: string,
  ): {
    hasConflict: boolean;
    severity: 'severe' | 'moderate' | 'mild' | 'dietary' | null;
    reason: string;
  } => {
    const cleanName = ingredientName.toLowerCase().trim();

    // Check severe allergies first
    for (const trigger of allergyTriggers.severe) {
      if (cleanName.includes(trigger)) {
        return {
          hasConflict: true,
          severity: 'severe',
          reason: `Severe allergy: ${trigger}`,
        };
      }
    }

    // Check moderate allergies
    for (const trigger of allergyTriggers.moderate) {
      if (cleanName.includes(trigger)) {
        return {
          hasConflict: true,
          severity: 'moderate',
          reason: `Allergy: ${trigger}`,
        };
      }
    }

    // Check mild allergies
    for (const trigger of allergyTriggers.mild) {
      if (cleanName.includes(trigger)) {
        return {
          hasConflict: true,
          severity: 'mild',
          reason: `Sensitivity: ${trigger}`,
        };
      }
    }

    // Check dietary restrictions
    for (const excluded of excludedIngredients) {
      if (cleanName.includes(excluded)) {
        return {
          hasConflict: true,
          severity: 'dietary',
          reason: `Dietary restriction: ${excluded}`,
        };
      }
    }

    return {hasConflict: false, severity: null, reason: ''};
  };

  const hasIngredient = (ingredientName: string): boolean => {
    let searchName = ingredientName.toLowerCase().trim();

    // Remove measurements (e.g., "1 cup flour" -> "flour")
    searchName = searchName.replace(/^[\d.\/\s]+/g, '').trim();

    // Remove units (cup, tbsp, oz, etc.)
    searchName = searchName
      .replace(/^(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l)\s+/i, '')
      .trim();

    // Check if user has this ingredient (smart matching that preserves types)
    const {ingredientsMatch} = require('../../utils/ingredientMatcher');
    return userIngredients.some(userIng => {
      return ingredientsMatch(searchName, userIng);
    });
  };

  const handleSelectSubstitution = (
    ingredientIndex: number,
    substitution: Substitution,
  ) => {
    setSelectedSubstitutions(prev => ({
      ...prev,
      [ingredientIndex]:
        prev[ingredientIndex]?.substitute === substitution.substitute
          ? null // Deselect if already selected
          : substitution, // Select new substitution
    }));
  };

  const calculateSubstitutionQuantity = (
    originalQuantity: string,
    ratio: string,
  ): string => {
    // Parse ratio (e.g., "1:1", "3:4", "1.5:1")
    const ratioMatch = ratio.match(/([\d.]+):([\d.]+)/);
    if (!ratioMatch) return originalQuantity;

    const numerator = parseFloat(ratioMatch[1] || '1');
    const denominator = parseFloat(ratioMatch[2] || '1');
    const ratioValue = numerator / denominator;

    // Parse original quantity
    const qtyNum = parseFloat(originalQuantity);
    if (isNaN(qtyNum)) return originalQuantity;

    // Calculate new quantity
    const newQty = qtyNum * ratioValue;
    return Math.round(newQty * 100) / 100 + ''; // Round to 2 decimals
  };

  const parseIngredient = (
    ingredientStr: string,
  ): {
    ingredient: string;
    quantity: string;
    unit: string;
  } => {
    // Common units to look for
    const units = [
      'cup',
      'cups',
      'tablespoon',
      'tablespoons',
      'tbsp',
      'teaspoon',
      'teaspoons',
      'tsp',
      'ounce',
      'ounces',
      'oz',
      'pound',
      'pounds',
      'lb',
      'lbs',
      'gram',
      'grams',
      'g',
      'kilogram',
      'kilograms',
      'kg',
      'milliliter',
      'milliliters',
      'ml',
      'liter',
      'liters',
      'l',
      'pinch',
      'dash',
      'clove',
      'cloves',
      'slice',
      'slices',
      'can',
      'cans',
      'package',
      'packages',
      'jar',
      'jars',
    ];

    let cleaned = ingredientStr.trim();

    // Try to match: number + optional unit + ingredient
    // Examples: "2 cups flour", "1/2 tsp salt", "3 chicken breasts"
    const regex = /^([\d\s\/.-]+)\s*([a-zA-Z]+)?\s*(.+)$/;
    const match = cleaned.match(regex);

    if (match) {
      const quantity = match[1]?.trim() || '1';
      const possibleUnit = match[2]?.toLowerCase() || '';
      const rest = match[3]?.trim() || cleaned;

      // Check if the possible unit is actually a unit
      if (possibleUnit && units.includes(possibleUnit)) {
        return {
          ingredient: rest,
          quantity: quantity,
          unit: possibleUnit,
        };
      } else {
        // The "unit" is actually part of the ingredient name
        return {
          ingredient: possibleUnit ? `${possibleUnit} ${rest}` : rest,
          quantity: quantity,
          unit: '',
        };
      }
    }

    // No quantity found, return as-is
    return {
      ingredient: cleaned,
      quantity: '1',
      unit: '',
    };
  };

  const addMissingToShoppingList = async () => {
    if (!recipe) return;

    try {
      // Get missing ingredients with parsed quantities
      const missingIngredients: Array<{
        ingredient: string;
        quantity: string;
        unit: string;
      }> = [];

      if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach((ing, index) => {
          // Check if user already has this ingredient
          const alreadyHave = hasIngredient(ing);

          // Check for dietary/allergy conflicts
          const conflict = checkIngredientConflict(ing);

          // Check if user selected a substitution
          const hasSelectedSubstitution =
            selectedSubstitutions[index] !== undefined &&
            selectedSubstitutions[index] !== null;

          console.log(`Ingredient ${index}: "${ing}"`, {
            alreadyHave,
            hasConflict: conflict.hasConflict,
            hasSelectedSubstitution,
            selectedSub: selectedSubstitutions[index]?.substitute,
          });

          // Only add if user doesn't already have it
          if (!alreadyHave) {
            // If there's a conflict AND user selected a substitution, use the substitution
            if (conflict.hasConflict && hasSelectedSubstitution) {
              const sub = selectedSubstitutions[index];
              const parsed = parseIngredient(ing);

              // Calculate quantity based on substitution ratio
              const adjustedQuantity = calculateSubstitutionQuantity(
                parsed.quantity,
                sub!.ratio,
              );

              console.log(
                `✅ Adding substitution: ${sub!.substitute} (${adjustedQuantity} ${parsed.unit})`,
              );

              missingIngredients.push({
                ingredient: sub!.substitute,
                quantity: adjustedQuantity,
                unit: parsed.unit,
              });
            } else {
              // No substitution selected, add original ingredient
              const parsed = parseIngredient(ing);

              console.log(
                `➕ Adding original: ${parsed.ingredient} (${parsed.quantity} ${parsed.unit})`,
              );

              missingIngredients.push(parsed);
            }
          }
        });
      }

      if (missingIngredients.length === 0) {
        Alert.alert(
          'All Set!',
          'You have all the ingredients for this recipe!',
        );
        return;
      }

      // Add items to shopping list via API
      await shoppingListService.addItems(
        missingIngredients.map(item => ({
          ingredient: item.ingredient,
          quantity: item.quantity,
          unit: item.unit,
          category: 'other',
          recipeId: recipe.id.toString(),
        })),
      );

      Alert.alert(
        'Added to Shopping List',
        `${missingIngredients.length} missing ingredient(s) added to your shopping list.`,
      );
    } catch (err) {
      console.error('Error adding to shopping list:', err);
      Alert.alert('Error', 'Failed to add ingredients to shopping list');
    }
  };

  const loadRecipe = async () => {
    try {
      console.log('[RecipeDetail] Loading recipe:', recipeId);
      setLoading(true);
      setError(null);

      if (!recipeId) {
        throw new Error('No recipe ID provided');
      }

      const details = await getRecipeDetails(recipeId);
      console.log('[RecipeDetail] Recipe loaded:', {
        id: details?.id,
        title: details?.title,
        hasIngredients: !!details?.ingredients,
        ingredientsCount: details?.ingredients?.length || 0,
      });

      if (!details) {
        throw new Error('Recipe not found');
      }

      setRecipe(details);
      setServings(details.servings || 1); // Set initial servings with fallback
    } catch (err) {
      console.error('[RecipeDetail] Error loading recipe:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const adjustServings = (newServings: number) => {
    if (newServings < 1) return;
    setServings(newServings);
  };

  const getScaledAmount = (original: string): string => {
    if (!recipe || servings === recipe.servings) return original;
    const scale = servings / recipe.servings;

    // Try to extract number from the beginning of the string
    const match = original.match(/^([\d.\/\s]+)/);
    if (match) {
      const numStr = match[1].trim();
      // Handle fractions like "1/2"
      if (numStr.includes('/')) {
        const parts = numStr.split('/');
        if (parts.length === 2) {
          const num = parseFloat(parts[0]?.trim() || '0');
          const denom = parseFloat(parts[1]?.trim() || '1');
          if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
            const scaled = (num / denom) * scale;
            const rest = original.substring(match[0].length);
            // Format nicely - show fractions if possible
            if (scaled < 1 && scaled > 0) {
              return `${scaled.toFixed(2)} ${rest}`;
            }
            return `${Math.round(scaled * 100) / 100} ${rest}`;
          }
        }
      }
      // Handle regular numbers
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        const scaled = num * scale;
        const rest = original.substring(match[0].length);
        return `${Math.round(scaled * 100) / 100} ${rest}`;
      }
    }
    return original;
  };

  const checkIfSaved = async () => {
    try {
      const saved = await isRecipeSaved(recipeId);
      setIsSaved(saved);
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const handleSave = async () => {
    if (!recipe) return;

    try {
      if (isSaved) {
        await deleteSavedRecipe(recipeId);
        setIsSaved(false);
        Alert.alert('Success', 'Recipe removed from saved recipes');
      } else {
        await saveRecipe(recipe);
        setIsSaved(true);
        Alert.alert('Success', 'Recipe saved successfully!');
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save recipe',
      );
    }
  };

  const handleOpenSource = () => {
    if (recipe?.sourceUrl) {
      Linking.openURL(recipe.sourceUrl);
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error || 'Recipe not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRecipe}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Icon
            name={isSaved ? 'favorite' : 'favorite-border'}
            size={24}
            color={isSaved ? '#EF4444' : '#374151'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Recipe Image */}
        <RecipeImage
          imageUrl={recipe.image || recipe.imageUrl}
          style={styles.image}
          placeholderStyle={styles.placeholderImage}
        />

        {/* Recipe Info */}
        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => handleRate(star)}>
                  <Icon
                    name={
                      star <= (userRating || avgRating) ? 'star' : 'star-border'
                    }
                    size={24}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>
            {totalRatings > 0 && (
              <Text style={styles.ratingText}>
                {avgRating.toFixed(1)} ({totalRatings}{' '}
                {totalRatings === 1 ? 'rating' : 'ratings'})
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.cookButton, {flex: 1}]}
              onPress={handleCookThis}>
              <Icon name="restaurant" size={20} color="#FFFFFF" />
              <Text style={styles.cookButtonText}>I Cooked This!</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepByStepButton, {flex: 1}]}
              onPress={() =>
                navigation.navigate('StepByStepCooking', {recipe})
              }>
              <Icon name="play-arrow" size={20} color="#10B981" />
              <Text style={styles.stepByStepButtonText}>Step-by-Step</Text>
            </TouchableOpacity>
          </View>

          {/* Shopping List Button */}
          <TouchableOpacity
            style={styles.shoppingListButton}
            onPress={handleAddToShoppingList}>
            <Icon name="shopping-cart" size={20} color="#10B981" />
            <Text style={styles.shoppingListButtonText}>
              Add Ingredients to Shopping List
            </Text>
          </TouchableOpacity>

          {/* Social Actions */}
          <RecipeSocialActions recipeId={recipeId} recipeTitle={recipe.title} />

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Icon name="schedule" size={20} color="#10B981" />
              <Text style={styles.statText}>{recipe.readyInMinutes} min</Text>
            </View>
            {recipe.cuisines.length > 0 && (
              <View style={styles.statItem}>
                <Icon name="public" size={20} color="#10B981" />
                <Text style={styles.statText}>{recipe.cuisines[0]}</Text>
              </View>
            )}
          </View>

          {/* Servings Adjuster */}
          <View style={styles.servingsContainer}>
            <Text style={styles.servingsLabel}>Servings:</Text>
            <View style={styles.servingsControls}>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => adjustServings(servings - 1)}
                disabled={servings <= 1}>
                <Icon
                  name="remove"
                  size={20}
                  color={servings <= 1 ? '#D1D5DB' : '#10B981'}
                />
              </TouchableOpacity>
              <Text style={styles.servingsValue}>{servings}</Text>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => adjustServings(servings + 1)}>
                <Icon name="add" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
            {servings !== recipe.servings && (
              <TouchableOpacity onPress={() => setServings(recipe.servings)}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Provider Attribution - FatSecret */}
          {recipe.provider === 'fatsecret' && (
            <View style={styles.providerBadge}>
              <Icon name="info-outline" size={14} color="#8B5CF6" />
              <Text style={styles.providerText}>
                Recipe powered by FatSecret Platform API
              </Text>
            </View>
          )}

          {/* Summary */}
          {recipe.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.summaryText}>
                {stripHtml(recipe.summary)}
              </Text>
            </View>
          )}

          {/* Nutrition Facts */}
          <NutritionFacts
            servings={recipe.servings}
            calories={recipe.calories}
            protein={recipe.protein}
            carbs={recipe.carbs}
            fat={recipe.fat}
            fiber={recipe.fiber}
            sugar={recipe.sugar}
            sodium={recipe.sodium}
            saturatedFat={recipe.saturatedFat}
            cholesterol={recipe.cholesterol}
          />

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ingredient: string, index: number) => {
                const haveIt = hasIngredient(ingredient);
                const conflict = checkIngredientConflict(ingredient);
                const substitutions = conflict.hasConflict
                  ? findSubstitutions(ingredient)
                  : [];

                // Determine icon and color
                let iconName = 'cancel';
                let iconColor = '#EF4444';
                if (conflict.hasConflict) {
                  iconName = 'warning';
                  iconColor =
                    conflict.severity === 'severe' ? '#DC2626' : '#EF4444';
                } else if (haveIt) {
                  iconName = 'check-circle';
                  iconColor = '#10B981';
                }

                return (
                  <View key={index} style={styles.ingredientItem}>
                    <Icon name={iconName} size={16} color={iconColor} />
                    <View style={{flex: 1}}>
                      <Text
                        style={[
                          styles.ingredientText,
                          haveIt && styles.ingredientHave,
                          conflict.hasConflict && styles.ingredientConflict,
                        ]}>
                        {getScaledAmount(ingredient)}
                      </Text>
                      {conflict.hasConflict && (
                        <>
                          <Text style={styles.conflictReason}>
                            ⚠️ {conflict.reason}
                          </Text>
                          {substitutions.length > 0 && (
                            <View style={styles.substitutionContainer}>
                              <Text style={styles.substitutionLabel}>
                                💡 Try instead:
                              </Text>
                              {substitutions
                                .slice(0, 2)
                                .map((sub: Substitution, subIndex: number) => {
                                  const isSelected =
                                    selectedSubstitutions[index]?.substitute ===
                                    sub.substitute;
                                  return (
                                    <TouchableOpacity
                                      key={subIndex}
                                      style={[
                                        styles.substitutionButton,
                                        isSelected &&
                                          styles.substitutionButtonSelected,
                                      ]}
                                      onPress={() =>
                                        handleSelectSubstitution(index, sub)
                                      }>
                                      <Icon
                                        name={
                                          isSelected
                                            ? 'check-circle'
                                            : 'radio-button-unchecked'
                                        }
                                        size={16}
                                        color={
                                          isSelected ? '#10B981' : '#9CA3AF'
                                        }
                                      />
                                      <Text
                                        style={[
                                          styles.substitutionButtonText,
                                          isSelected &&
                                            styles.substitutionButtonTextSelected,
                                        ]}>
                                        {sub.substitute} ({sub.ratio})
                                        {sub.notes ? ` - ${sub.notes}` : ''}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noInstructionsText}>
                No ingredients available
              </Text>
            )}

            {/* Add Missing Ingredients Button */}
            <TouchableOpacity
              style={styles.shoppingListButton}
              onPress={addMissingToShoppingList}>
              <Icon name="add-shopping-cart" size={20} color="#10B981" />
              <Text style={styles.shoppingListButtonText}>
                Add Missing Ingredients to Shopping List
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions ? (
              <Text style={styles.instructionsText}>
                {stripHtml(recipe.instructions)}
              </Text>
            ) : (
              <Text style={styles.noInstructionsText}>
                No instructions available. View original recipe for details.
              </Text>
            )}
          </View>

          {/* Comments */}
          <View style={styles.section}>
            <RecipeComments recipeId={recipeId} />
          </View>

          {/* Source Link */}
          {recipe.sourceUrl && (
            <TouchableOpacity
              style={styles.sourceButton}
              onPress={handleOpenSource}>
              <Icon name="open-in-new" size={20} color="#10B981" />
              <Text style={styles.sourceButtonText}>View Original Recipe</Text>
            </TouchableOpacity>
          )}

          {/* Data Attribution */}
          <View style={styles.attributionContainer}>
            <Text style={styles.attributionText}>
              Recipe data provided by{' '}
              <Text
                style={styles.attributionLink}
                onPress={() => Linking.openURL('https://www.fatsecret.com/')}>
                FatSecret Platform API
              </Text>
            </Text>
          </View>

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#E5E7EB',
  },
  placeholderImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  shoppingListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10B981',
    marginBottom: 16,
  },
  shoppingListButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  cookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepByStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepByStepButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 16,
  },
  servingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  servingsValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 30,
    textAlign: 'center',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  providerText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingLeft: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  ingredientHave: {
    color: '#059669',
    fontWeight: '500',
  },
  ingredientConflict: {
    color: '#DC2626',
    fontWeight: '600',
  },
  conflictReason: {
    fontSize: 12,
    color: '#DC2626',
    fontStyle: 'italic',
    marginTop: 2,
    marginLeft: 20,
  },
  substitutionContainer: {
    marginTop: 4,
    marginLeft: 20,
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  substitutionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  substitutionText: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
    marginTop: 2,
  },
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
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  noInstructionsText: {
    fontSize: 15,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  sourceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  attributionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  attributionText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  attributionLink: {
    color: '#10B981',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});
