/**
 * Ingredient Matcher Utility
 * Intelligently matches ingredients while preserving type information
 */

// Common brand names to remove
const BRANDS = [
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

// Important types to preserve
const IMPORTANT_TYPES = {
  chicken: [
    'breast',
    'thigh',
    'drumstick',
    'wing',
    'tender',
    'cutlet',
    'ground',
    'whole',
    'rotisserie',
  ],
  beef: [
    'ground',
    'steak',
    'roast',
    'brisket',
    'chuck',
    'sirloin',
    'ribeye',
    'tenderloin',
    'short rib',
  ],
  pork: [
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
  ],
  cheese: [
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
    'ricotta',
    'cream cheese',
    'cottage cheese',
  ],
  milk: [
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
    'lactose-free',
    'buttermilk',
  ],
  chocolate: [
    'dark',
    'milk',
    'white',
    'semi-sweet',
    'bittersweet',
    'unsweetened',
  ],
  jelly: [
    'strawberry',
    'grape',
    'raspberry',
    'blueberry',
    'blackberry',
    'apricot',
    'peach',
    'cherry',
  ],
  bread: [
    'white',
    'wheat',
    'whole wheat',
    'whole grain',
    'rye',
    'sourdough',
    'multigrain',
  ],
  rice: ['white', 'brown', 'jasmine', 'basmati', 'wild', 'arborio'],
  pasta: [
    'spaghetti',
    'penne',
    'fettuccine',
    'linguine',
    'rigatoni',
    'macaroni',
  ],
  beans: ['black', 'kidney', 'pinto', 'navy', 'lima', 'garbanzo', 'chickpea'],
};

// Words to remove (but not if they're part of a type)
const REMOVE_WORDS = [
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
  'halved',
  'quartered',
  'peeled',
  'unpeeled',
  'raw',
  'cooked',
];

interface NormalizedIngredient {
  base: string;
  type?: string;
  normalized: string;
  original: string;
}

/**
 * Normalize an ingredient name
 */
export function normalizeIngredient(ingredient: string): NormalizedIngredient {
  const original = ingredient;
  let normalized = ingredient.toLowerCase().trim();

  // Remove content in parentheses
  normalized = normalized.replace(/\([^)]*\)/g, '').trim();

  // Remove brand names
  for (const brand of BRANDS) {
    const regex = new RegExp(`\\b${brand}\\b`, 'gi');
    normalized = normalized.replace(regex, '').trim();
  }

  // Detect type and base
  const type = detectType(normalized);
  const base = detectBase(normalized);

  // Remove preparation words (but keep type words)
  let finalName = normalized;
  for (const word of REMOVE_WORDS) {
    if (type && type.includes(word)) continue;
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    finalName = finalName.replace(regex, '').trim();
  }

  // Clean up spaces
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
function detectType(ingredient: string): string | undefined {
  const lower = ingredient.toLowerCase();

  // Check meats first with their base word to avoid confusion
  // (e.g., "chicken breast" not "breast cheese")
  if (lower.includes('chicken')) {
    for (const type of IMPORTANT_TYPES.chicken) {
      if (lower.includes(type)) {
        return type;
      }
    }
  }

  if (lower.includes('beef')) {
    for (const type of IMPORTANT_TYPES.beef) {
      if (lower.includes(type)) {
        return type;
      }
    }
  }

  if (lower.includes('pork')) {
    for (const type of IMPORTANT_TYPES.pork) {
      if (lower.includes(type)) {
        return type;
      }
    }
  }

  // Check other categories
  for (const [category, types] of Object.entries(IMPORTANT_TYPES)) {
    if (category === 'chicken' || category === 'beef' || category === 'pork') {
      continue; // Already checked above
    }
    for (const type of types) {
      if (lower.includes(type)) {
        return type;
      }
    }
  }

  return undefined;
}

/**
 * Detect the base ingredient category
 */
function detectBase(ingredient: string): string {
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

  // Return the last significant word as base
  const words = lower.split(' ').filter(w => w.length > 2);
  return words[words.length - 1] || lower;
}

/**
 * Check if two ingredients match
 */
export function ingredientsMatch(
  ingredient1: string,
  ingredient2: string,
): boolean {
  const norm1 = normalizeIngredient(ingredient1);
  const norm2 = normalizeIngredient(ingredient2);

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
 * Get display name for an ingredient
 */
export function getIngredientDisplayName(ingredient: string): string {
  const norm = normalizeIngredient(ingredient);
  return norm.normalized;
}
