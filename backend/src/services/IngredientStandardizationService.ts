/**
 * Ingredient Standardization Service
 *
 * Normalizes ingredient names from various sources (recipes, shopping lists, user input)
 * into standardized, searchable formats that work with FatSecret API and recipe matching.
 */

import {IngredientModel} from '../models/Ingredient';

export interface StandardizedIngredient {
  standardName: string;
  category: string;
  commonNames: string[];
  defaultUnit: string;
  confidence: number; // 0-1 confidence in the standardization
}

export class IngredientStandardizationService {
  // Common ingredient mappings for standardization
  private static readonly INGREDIENT_MAPPINGS = new Map([
    // Proteins
    [
      'chicken breast',
      {standard: 'chicken breast', category: 'meat', unit: 'lb'},
    ],
    ['chicken', {standard: 'chicken', category: 'meat', unit: 'lb'}],
    ['beef', {standard: 'ground beef', category: 'meat', unit: 'lb'}],
    ['ground beef', {standard: 'ground beef', category: 'meat', unit: 'lb'}],
    ['salmon', {standard: 'salmon fillet', category: 'seafood', unit: 'lb'}],
    ['tuna', {standard: 'tuna', category: 'seafood', unit: 'can'}],
    ['eggs', {standard: 'eggs', category: 'dairy', unit: 'dozen'}],

    // Vegetables
    ['onion', {standard: 'onion', category: 'vegetables', unit: 'piece'}],
    ['onions', {standard: 'onion', category: 'vegetables', unit: 'piece'}],
    ['tomato', {standard: 'tomato', category: 'vegetables', unit: 'piece'}],
    ['tomatoes', {standard: 'tomato', category: 'vegetables', unit: 'piece'}],
    ['carrot', {standard: 'carrot', category: 'vegetables', unit: 'piece'}],
    ['carrots', {standard: 'carrot', category: 'vegetables', unit: 'piece'}],
    ['potato', {standard: 'potato', category: 'vegetables', unit: 'piece'}],
    ['potatoes', {standard: 'potato', category: 'vegetables', unit: 'piece'}],
    [
      'bell pepper',
      {standard: 'bell pepper', category: 'vegetables', unit: 'piece'},
    ],
    [
      'pepper',
      {standard: 'bell pepper', category: 'vegetables', unit: 'piece'},
    ],
    ['garlic', {standard: 'garlic', category: 'vegetables', unit: 'clove'}],
    ['spinach', {standard: 'spinach', category: 'vegetables', unit: 'bunch'}],
    ['lettuce', {standard: 'lettuce', category: 'vegetables', unit: 'head'}],

    // Fruits
    ['apple', {standard: 'apple', category: 'fruits', unit: 'piece'}],
    ['apples', {standard: 'apple', category: 'fruits', unit: 'piece'}],
    ['banana', {standard: 'banana', category: 'fruits', unit: 'piece'}],
    ['bananas', {standard: 'banana', category: 'fruits', unit: 'piece'}],
    ['orange', {standard: 'orange', category: 'fruits', unit: 'piece'}],
    ['oranges', {standard: 'orange', category: 'fruits', unit: 'piece'}],
    ['lemon', {standard: 'lemon', category: 'fruits', unit: 'piece'}],
    ['lemons', {standard: 'lemon', category: 'fruits', unit: 'piece'}],
    ['lime', {standard: 'lime', category: 'fruits', unit: 'piece'}],
    ['limes', {standard: 'lime', category: 'fruits', unit: 'piece'}],
    ['avocado', {standard: 'avocado', category: 'fruits', unit: 'piece'}],
    ['avocados', {standard: 'avocado', category: 'fruits', unit: 'piece'}],

    // Grains & Starches
    ['rice', {standard: 'white rice', category: 'grains', unit: 'cup'}],
    ['white rice', {standard: 'white rice', category: 'grains', unit: 'cup'}],
    ['brown rice', {standard: 'brown rice', category: 'grains', unit: 'cup'}],
    ['pasta', {standard: 'pasta', category: 'grains', unit: 'lb'}],
    ['bread', {standard: 'bread', category: 'grains', unit: 'loaf'}],
    ['flour', {standard: 'all-purpose flour', category: 'baking', unit: 'cup'}],

    // Dairy
    ['milk', {standard: 'milk', category: 'dairy', unit: 'cup'}],
    ['cheese', {standard: 'cheddar cheese', category: 'dairy', unit: 'oz'}],
    ['butter', {standard: 'butter', category: 'dairy', unit: 'stick'}],
    ['yogurt', {standard: 'plain yogurt', category: 'dairy', unit: 'cup'}],

    // Pantry Items
    ['olive oil', {standard: 'olive oil', category: 'oils', unit: 'tbsp'}],
    ['salt', {standard: 'salt', category: 'spices', unit: 'tsp'}],
    ['pepper', {standard: 'black pepper', category: 'spices', unit: 'tsp'}],
    [
      'black pepper',
      {standard: 'black pepper', category: 'spices', unit: 'tsp'},
    ],
    ['sugar', {standard: 'granulated sugar', category: 'baking', unit: 'cup'}],
  ]);

  /**
   * Standardize an ingredient name from any source
   */
  static async standardizeIngredient(
    rawName: string,
  ): Promise<StandardizedIngredient> {
    if (!rawName || rawName.trim().length === 0) {
      throw new Error('Ingredient name cannot be empty');
    }

    // Step 1: Clean the raw name
    const cleanedName = this.cleanIngredientName(rawName);

    // Step 2: Try to find exact match in our mappings
    const mapping = this.INGREDIENT_MAPPINGS.get(cleanedName.toLowerCase());
    if (mapping) {
      return {
        standardName: mapping.standard,
        category: mapping.category,
        commonNames: [cleanedName, mapping.standard],
        defaultUnit: mapping.unit,
        confidence: 0.95,
      };
    }

    // Step 3: Try to find in database
    const dbIngredient = await IngredientModel.findByName(cleanedName);
    if (dbIngredient) {
      return {
        standardName: dbIngredient.name,
        category: dbIngredient.category,
        commonNames: [cleanedName, ...dbIngredient.common_names],
        defaultUnit: dbIngredient.default_unit,
        confidence: 0.9,
      };
    }

    // Step 4: Try fuzzy matching
    const fuzzyMatch = await this.findFuzzyMatch(cleanedName);
    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    // Step 5: Create a standardized version from the cleaned name
    return {
      standardName: cleanedName,
      category: this.guessCategory(cleanedName),
      commonNames: [cleanedName],
      defaultUnit: 'piece',
      confidence: 0.5,
    };
  }

  /**
   * Clean ingredient name - same logic as in recipes.ts but more comprehensive
   */
  private static cleanIngredientName(rawName: string): string {
    if (!rawName) return '';

    let cleaned = rawName.toLowerCase().trim();

    // Handle ingredients that start with punctuation or measurements
    if (
      cleaned.startsWith(',') ||
      cleaned.startsWith('fl oz') ||
      cleaned.startsWith('serving')
    ) {
      const words = cleaned.split(/[,\s]+/).filter(word => word.length > 2);
      const ingredientWords = words.filter(
        word =>
          ![
            'cup',
            'cups',
            'tbsp',
            'tsp',
            'oz',
            'fl',
            'lb',
            'lbs',
            'g',
            'kg',
            'ml',
            'l',
            'serving',
            'servings',
            'piece',
            'pieces',
            'slice',
            'slices',
            'chopped',
            'sliced',
            'diced',
            'minced',
          ].includes(word) && !/^\d/.test(word),
      );

      if (ingredientWords.length > 0) {
        cleaned = ingredientWords[0];
      }
    } else {
      // Remove everything after first comma (descriptions)
      cleaned = cleaned.split(',')[0].trim();

      // Remove "NS as to" patterns
      cleaned = cleaned.replace(/\bns as to\b.*$/i, '');

      // Remove numbers and fractions
      cleaned = cleaned.replace(/\b\d+[\s\w]*\b/g, '');
      cleaned = cleaned.replace(/\b\d+\/\d+\b/g, '');
      cleaned = cleaned.replace(/\b\d+\.\d+\b/g, '');

      // Remove measurement units
      const units = [
        'cup',
        'cups',
        'tbsp',
        'tsp',
        'oz',
        'fl oz',
        'lb',
        'lbs',
        'g',
        'kg',
        'ml',
        'l',
        'serving',
        'servings',
        'piece',
        'pieces',
        'slice',
        'slices',
      ];
      units.forEach(unit => {
        cleaned = cleaned.replace(new RegExp(`\\b${unit}s?\\b`, 'gi'), '');
      });

      // Remove preparation methods
      cleaned = cleaned.replace(
        /\b(chopped|sliced|diced|minced|fresh|dried|ground|raw|cooked|frozen)\b/gi,
        '',
      );

      // Clean up whitespace and punctuation
      cleaned = cleaned.replace(/[,;:()]/g, ' ');
      cleaned = cleaned.replace(/\s+/g, ' ');
      cleaned = cleaned.trim();

      // Get the first meaningful word(s)
      const words = cleaned.split(' ').filter(word => word.length > 2);
      if (words.length > 0) {
        // For compound ingredients, keep up to 2 words
        cleaned = words.slice(0, 2).join(' ');
      }
    }

    // Handle plurals
    if (cleaned.endsWith('s') && cleaned.length > 3) {
      const singular = cleaned.slice(0, -1);
      if (this.INGREDIENT_MAPPINGS.has(singular)) {
        cleaned = singular;
      }
    }

    return cleaned;
  }

  /**
   * Find fuzzy matches in the database
   */
  private static async findFuzzyMatch(
    cleanedName: string,
  ): Promise<StandardizedIngredient | null> {
    try {
      const searchResults = await IngredientModel.searchIngredients(
        cleanedName,
        5,
      );

      for (const ingredient of searchResults) {
        // Check if it's a close match
        const similarity = this.calculateSimilarity(
          cleanedName,
          ingredient.name,
        );
        if (similarity > 0.7) {
          return {
            standardName: ingredient.name,
            category: ingredient.category,
            commonNames: [
              cleanedName,
              ingredient.name,
              ...ingredient.common_names,
            ],
            defaultUnit: ingredient.default_unit,
            confidence: similarity * 0.8, // Reduce confidence for fuzzy matches
          };
        }
      }
    } catch (error) {
      console.log('Fuzzy matching failed:', error);
    }

    return null;
  }

  /**
   * Calculate similarity between two strings (simple Levenshtein-based)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Guess category based on ingredient name
   */
  private static guessCategory(name: string): string {
    const lowerName = name.toLowerCase();

    // Meat keywords
    if (
      /\b(chicken|beef|pork|lamb|turkey|fish|salmon|tuna|shrimp|crab)\b/.test(
        lowerName,
      )
    ) {
      return 'meat';
    }

    // Vegetable keywords
    if (
      /\b(onion|tomato|carrot|potato|pepper|garlic|spinach|lettuce|broccoli|cucumber)\b/.test(
        lowerName,
      )
    ) {
      return 'vegetables';
    }

    // Fruit keywords
    if (
      /\b(apple|banana|orange|lemon|lime|avocado|berry|grape|melon)\b/.test(
        lowerName,
      )
    ) {
      return 'fruits';
    }

    // Dairy keywords
    if (/\b(milk|cheese|butter|yogurt|cream)\b/.test(lowerName)) {
      return 'dairy';
    }

    // Grain keywords
    if (/\b(rice|pasta|bread|flour|oats|quinoa)\b/.test(lowerName)) {
      return 'grains';
    }

    return 'other';
  }

  /**
   * Standardize multiple ingredients at once
   */
  static async standardizeIngredients(
    rawNames: string[],
  ): Promise<StandardizedIngredient[]> {
    const results = await Promise.all(
      rawNames.map(name => this.standardizeIngredient(name)),
    );
    return results;
  }

  /**
   * Get standardized name for recipe matching
   */
  static async getStandardizedNameForMatching(
    rawName: string,
  ): Promise<string> {
    try {
      const standardized = await this.standardizeIngredient(rawName);
      return standardized.standardName;
    } catch (error) {
      console.log(`Failed to standardize ingredient "${rawName}":`, error);
      return this.cleanIngredientName(rawName);
    }
  }
}
