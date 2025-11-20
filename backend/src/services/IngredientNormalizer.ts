/**
 * Ingredient Normalizer Service
 * Intelligently normalizes ingredient names while preserving important type information
 * (e.g., "cheddar cheese" vs "swiss cheese", "whole milk" vs "skim milk")
 */

interface NormalizedIngredient {
  base: string; // Base ingredient (e.g., "cheese", "milk")
  type: string | undefined; // Type/variety (e.g., "cheddar", "whole")
  normalized: string; // Full normalized name (e.g., "cheddar cheese")
  original: string; // Original input
}

class IngredientNormalizer {
  // Common brand names to remove
  private readonly BRANDS = [
    'great value',
    'kroger',
    'walmart',
    'target',
    'kirkland',
    'trader joe',
    'whole foods',
    '365',
    'organic valley',
    'horizon',
    'land o lakes',
    'kraft',
    'philadelphia',
    'sargento',
    'tillamook',
    'cabot',
    'kerrygold',
  ];

  // Ingredient types that should be preserved
  private readonly CHEESE_TYPES = [
    'cheddar',
    'swiss',
    'mozzarella',
    'parmesan',
    'provolone',
    'american',
    'pepper jack',
    'monterey jack',
    'colby',
    'gouda',
    'brie',
    'feta',
    'blue',
    'gorgonzola',
    'ricotta',
    'cream cheese',
    'cottage cheese',
    'string cheese',
  ];

  private readonly MILK_TYPES = [
    'whole',
    'skim',
    '2%',
    '1%',
    'fat-free',
    'low-fat',
    'almond',
    'soy',
    'oat',
    'coconut',
    'cashew',
    'rice',
    'lactose-free',
    'buttermilk',
    'evaporated',
    'condensed',
  ];

  private readonly CHOCOLATE_TYPES = [
    'dark',
    'milk',
    'white',
    'semi-sweet',
    'bittersweet',
    'unsweetened',
    'cocoa',
  ];

  private readonly JELLY_TYPES = [
    'strawberry',
    'grape',
    'raspberry',
    'blueberry',
    'blackberry',
    'apricot',
    'peach',
    'cherry',
    'mixed berry',
    'orange marmalade',
  ];

  private readonly BREAD_TYPES = [
    'white',
    'wheat',
    'whole wheat',
    'whole grain',
    'rye',
    'sourdough',
    'pumpernickel',
    'multigrain',
    'italian',
    'french',
    'ciabatta',
    'baguette',
    'pita',
    'naan',
  ];

  private readonly RICE_TYPES = [
    'white',
    'brown',
    'jasmine',
    'basmati',
    'wild',
    'arborio',
    'sushi',
    'long grain',
    'short grain',
  ];

  private readonly PASTA_TYPES = [
    'spaghetti',
    'penne',
    'fettuccine',
    'linguine',
    'rigatoni',
    'macaroni',
    'rotini',
    'farfalle',
    'angel hair',
    'lasagna',
  ];

  private readonly BEAN_TYPES = [
    'black',
    'kidney',
    'pinto',
    'navy',
    'great northern',
    'lima',
    'garbanzo',
    'chickpea',
    'cannellini',
    'fava',
  ];

  private readonly CHICKEN_TYPES = [
    'breast',
    'thigh',
    'drumstick',
    'wing',
    'tender',
    'cutlet',
    'ground',
    'whole',
    'rotisserie',
  ];

  private readonly BEEF_TYPES = [
    'ground',
    'steak',
    'roast',
    'brisket',
    'chuck',
    'sirloin',
    'ribeye',
    'tenderloin',
    'short rib',
  ];

  private readonly PORK_TYPES = [
    'chop',
    'loin',
    'tenderloin',
    'shoulder',
    'belly',
    'ribs',
    'ground',
    'sausage',
    'bacon',
    'ham',
  ];

  // Words to remove (preparation methods, packaging, etc.)
  private readonly REMOVE_WORDS = [
    'fresh',
    'frozen',
    'canned',
    'dried',
    'organic',
    'sliced',
    'diced',
    'chopped',
    'minced',
    'shredded',
    'grated',
    'crushed',
    'ground',
    'whole',
    'halved',
    'quartered',
    'peeled',
    'unpeeled',
    'raw',
    'cooked',
    'package',
    'container',
    'bag',
    'box',
    'can',
  ];

  /**
   * Normalize an ingredient name
   */
  normalize(ingredient: string): NormalizedIngredient {
    const original = ingredient;
    let normalized = ingredient.toLowerCase().trim();

    // Remove content in parentheses (usually brand names or details)
    normalized = normalized.replace(/\([^)]*\)/g, '').trim();

    // Remove brand names
    for (const brand of this.BRANDS) {
      const regex = new RegExp(`\\b${brand}\\b`, 'gi');
      normalized = normalized.replace(regex, '').trim();
    }

    // Detect and preserve important types
    const type = this.detectType(normalized);
    const base = this.detectBase(normalized);

    // Build final normalized name
    let finalName = normalized;

    // Remove preparation words but keep type information
    for (const word of this.REMOVE_WORDS) {
      // Don't remove if it's part of the type
      if (type && type.includes(word)) continue;

      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      finalName = finalName.replace(regex, '').trim();
    }

    // Clean up extra spaces
    finalName = finalName.replace(/\s+/g, ' ').trim();

    return {
      base,
      type,
      normalized: finalName,
      original,
    };
  }

  /**
   * Detect the type/variety of an ingredient
   */
  private detectType(ingredient: string): string | undefined {
    const lower = ingredient.toLowerCase();

    // Check chicken types (check before cheese to avoid "breast" confusion)
    for (const type of this.CHICKEN_TYPES) {
      if (lower.includes('chicken') && lower.includes(type)) {
        return type;
      }
    }

    // Check beef types
    for (const type of this.BEEF_TYPES) {
      if (lower.includes('beef') && lower.includes(type)) {
        return type;
      }
    }

    // Check pork types
    for (const type of this.PORK_TYPES) {
      if (lower.includes('pork') && lower.includes(type)) {
        return type;
      }
    }

    // Check cheese types
    for (const type of this.CHEESE_TYPES) {
      if (lower.includes(type)) {
        return type;
      }
    }

    // Check milk types
    for (const type of this.MILK_TYPES) {
      if (lower.includes(type)) {
        return type;
      }
    }

    // Check chocolate types
    for (const type of this.CHOCOLATE_TYPES) {
      if (lower.includes(type)) {
        return type;
      }
    }

    // Check jelly/jam types
    for (const type of this.JELLY_TYPES) {
      if (lower.includes(type)) {
        return type;
      }
    }

    // Check bread types
    for (const type of this.BREAD_TYPES) {
      if (lower.includes(type)) {
        return type;
      }
    }

    // Check rice types
    for (const type of this.RICE_TYPES) {
      if (lower.includes(type)) {
        return type;
      }
    }

    // Check pasta types
    for (const type of this.PASTA_TYPES) {
      if (lower.includes(type)) {
        return type;
      }
    }

    // Check bean types
    for (const type of this.BEAN_TYPES) {
      if (lower.includes(type)) {
        return type;
      }
    }

    return undefined;
  }

  /**
   * Detect the base ingredient category
   */
  private detectBase(ingredient: string): string {
    const lower = ingredient.toLowerCase();

    // Check meats first (more specific)
    if (lower.includes('chicken')) return 'chicken';
    if (lower.includes('beef')) return 'beef';
    if (lower.includes('pork')) return 'pork';
    if (lower.includes('turkey')) return 'turkey';
    if (lower.includes('fish')) return 'fish';
    if (lower.includes('salmon')) return 'salmon';
    if (lower.includes('tuna')) return 'tuna';
    if (lower.includes('shrimp')) return 'shrimp';

    // Check other categories
    if (lower.includes('cheese')) return 'cheese';
    if (lower.includes('milk')) return 'milk';
    if (lower.includes('chocolate')) return 'chocolate';
    if (lower.includes('jelly') || lower.includes('jam')) return 'jelly';
    if (lower.includes('bread')) return 'bread';
    if (lower.includes('rice')) return 'rice';
    if (lower.includes('pasta')) return 'pasta';
    if (lower.includes('bean')) return 'beans';

    // Return the first significant word as base
    const words = lower.split(' ').filter(w => w.length > 2);
    return words[words.length - 1] || lower;
  }

  /**
   * Check if two ingredients match
   * Returns true if they're the same ingredient (considering type)
   */
  matches(ingredient1: string, ingredient2: string): boolean {
    const norm1 = this.normalize(ingredient1);
    const norm2 = this.normalize(ingredient2);

    // Exact match
    if (norm1.normalized === norm2.normalized) {
      return true;
    }

    // Same base but different types = no match
    // (e.g., "cheddar cheese" !== "swiss cheese")
    if (norm1.base === norm2.base) {
      // If both have types, they must match
      if (norm1.type && norm2.type) {
        return norm1.type === norm2.type;
      }
      // If one has a type and the other doesn't, consider it a match
      // (e.g., "cheese" matches "cheddar cheese")
      return true;
    }

    // Check if one contains the other
    return (
      norm1.normalized.includes(norm2.normalized) ||
      norm2.normalized.includes(norm1.normalized)
    );
  }

  /**
   * Get a user-friendly display name
   */
  getDisplayName(ingredient: string): string {
    const norm = this.normalize(ingredient);
    return norm.normalized;
  }
}

export default new IngredientNormalizer();
export {NormalizedIngredient};
