import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { RecipeDetailHeader } from '../components/RecipeDetailHeader';
import { IngredientsList } from '../components/IngredientsList';
import { CookingInstructions } from '../components/CookingInstructions';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  imageUrl?: string;
}

interface Props {
  recipeId: string;
  userId?: string;
}

export const RecipeDetailScreen: React.FC<Props> = ({ recipeId, userId }) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [servings, setServings] = useState(4);
  const [conflictingIngredients, setConflictingIngredients] = useState<string[]>([]);
  const [substitutions, setSubstitutions] = useState<any[]>([]);

  // Mock recipe data
  const mockRecipe: Recipe = {
    id: '1',
    title: 'Vegetarian Pasta Primavera',
    description: 'A colorful and healthy pasta dish loaded with fresh vegetables',
    ingredients: [
      '400g pasta',
      '2 tbsp olive oil',
      '1 onion, diced',
      '2 cloves garlic, minced',
      '1 bell pepper, sliced',
      '1 zucchini, sliced',
      '200g cherry tomatoes',
      '100g parmesan cheese',
      'Fresh basil leaves',
      'Salt and pepper to taste'
    ],
    instructions: [
      'Bring a large pot of salted water to boil and cook pasta according to package directions.',
      'Heat olive oil in a large pan over medium heat.',
      'Add onion and garlic, cook until fragrant, about 2 minutes.',
      'Add bell pepper and zucchini, cook for 5 minutes until tender.',
      'Add cherry tomatoes and cook until they start to burst.',
      'Drain pasta and add to the pan with vegetables.',
      'Toss everything together and season with salt and pepper.',
      'Serve hot topped with parmesan cheese and fresh basil.'
    ],
    cookingTime: 25,
    servings: 4,
    difficulty: 'easy',
    cuisine: 'italian'
  };

  useEffect(() => {
    // Simulate loading recipe
    setRecipe(mockRecipe);
    setServings(mockRecipe.servings);
    
    // Simulate dietary analysis if userId provided
    if (userId) {
      setConflictingIngredients(['parmesan cheese']);
      setSubstitutions([
        {
          original: 'parmesan cheese',
          substitutes: [
            {
              ingredient: 'nutritional yeast',
              ratio: '1:4',
              notes: 'For vegan option'
            }
          ]
        }
      ]);
    }
  }, [recipeId, userId]);

  const handleFavoritePress = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
      `${recipe?.title} has been ${isFavorite ? 'removed from' : 'added to'} your favorites.`
    );
  };

  const handleSharePress = () => {
    Alert.alert('Share Recipe', `Share ${recipe?.title} with friends!`);
  };

  const handleServingsChange = (newServings: number) => {
    setServings(newServings);
    // In a real app, you'd recalculate ingredient quantities here
  };

  if (!recipe) {
    return null; // Loading state
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <RecipeDetailHeader
          recipe={recipe}
          isFavorite={isFavorite}
          onFavoritePress={handleFavoritePress}
          onSharePress={handleSharePress}
        />
        
        <IngredientsList
          ingredients={recipe.ingredients}
          conflictingIngredients={conflictingIngredients}
          substitutions={substitutions}
          servings={servings}
          onServingsChange={handleServingsChange}
        />
        
        <CookingInstructions
          instructions={recipe.instructions}
          estimatedTime={recipe.cookingTime}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});