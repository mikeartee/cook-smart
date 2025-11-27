// Common ingredient substitutions for dietary restrictions and allergies

export interface Substitution {
  original: string;
  substitute: string;
  ratio: string; // e.g., "1:1" or "1 cup = 3/4 cup"
  notes?: string;
}

export const SUBSTITUTIONS: Record<string, Substitution[]> = {
  // Dairy substitutions
  milk: [
    {original: 'milk', substitute: 'almond milk', ratio: '1:1', notes: 'Works in most recipes'},
    {original: 'milk', substitute: 'oat milk', ratio: '1:1', notes: 'Creamier texture'},
    {original: 'milk', substitute: 'coconut milk', ratio: '1:1', notes: 'Adds slight coconut flavor'},
    {original: 'milk', substitute: 'soy milk', ratio: '1:1'},
  ],
  butter: [
    {original: 'butter', substitute: 'coconut oil', ratio: '1:1', notes: 'Best for baking'},
    {original: 'butter', substitute: 'olive oil', ratio: '3/4 cup oil = 1 cup butter', notes: 'For savory dishes'},
    {original: 'butter', substitute: 'vegan butter', ratio: '1:1'},
    {original: 'butter', substitute: 'applesauce', ratio: '1:1', notes: 'For baking, reduces fat'},
  ],
  cheese: [
    {original: 'cheese', substitute: 'nutritional yeast', ratio: '1/4 cup = 1 cup cheese', notes: 'For cheesy flavor'},
    {original: 'cheese', substitute: 'vegan cheese', ratio: '1:1'},
    {original: 'cheese', substitute: 'cashew cream', ratio: '1:1', notes: 'For creamy dishes'},
  ],
  cream: [
    {original: 'cream', substitute: 'coconut cream', ratio: '1:1'},
    {original: 'cream', substitute: 'cashew cream', ratio: '1:1'},
    {original: 'cream', substitute: 'oat cream', ratio: '1:1'},
  ],
  yogurt: [
    {original: 'yogurt', substitute: 'coconut yogurt', ratio: '1:1'},
    {original: 'yogurt', substitute: 'almond yogurt', ratio: '1:1'},
    {original: 'yogurt', substitute: 'soy yogurt', ratio: '1:1'},
  ],

  // Egg substitutions
  egg: [
    {original: 'egg', substitute: 'flax egg', ratio: '1 tbsp ground flax + 3 tbsp water = 1 egg', notes: 'Let sit 5 min'},
    {original: 'egg', substitute: 'chia egg', ratio: '1 tbsp chia seeds + 3 tbsp water = 1 egg', notes: 'Let sit 5 min'},
    {original: 'egg', substitute: 'applesauce', ratio: '1/4 cup = 1 egg', notes: 'For baking'},
    {original: 'egg', substitute: 'banana', ratio: '1/4 cup mashed = 1 egg', notes: 'Adds banana flavor'},
    {original: 'egg', substitute: 'aquafaba', ratio: '3 tbsp = 1 egg', notes: 'Liquid from canned chickpeas'},
  ],

  // Gluten substitutions
  flour: [
    {original: 'flour', substitute: 'almond flour', ratio: '1:1', notes: 'Denser texture'},
    {original: 'flour', substitute: 'coconut flour', ratio: '1/4 cup coconut = 1 cup flour', notes: 'Very absorbent'},
    {original: 'flour', substitute: 'gluten-free flour blend', ratio: '1:1', notes: 'Best all-purpose substitute'},
    {original: 'flour', substitute: 'oat flour', ratio: '1:1'},
  ],
  wheat: [
    {original: 'wheat', substitute: 'rice', ratio: '1:1'},
    {original: 'wheat', substitute: 'quinoa', ratio: '1:1'},
    {original: 'wheat', substitute: 'gluten-free pasta', ratio: '1:1'},
  ],
  bread: [
    {original: 'bread', substitute: 'gluten-free bread', ratio: '1:1'},
    {original: 'bread', substitute: 'lettuce wraps', ratio: '1:1', notes: 'For sandwiches'},
    {original: 'bread', substitute: 'rice paper', ratio: '1:1', notes: 'For wraps'},
  ],

  // Nut substitutions
  peanuts: [
    {original: 'peanuts', substitute: 'sunflower seeds', ratio: '1:1'},
    {original: 'peanuts', substitute: 'pumpkin seeds', ratio: '1:1'},
  ],
  'peanut butter': [
    {original: 'peanut butter', substitute: 'sunflower seed butter', ratio: '1:1'},
    {original: 'peanut butter', substitute: 'tahini', ratio: '1:1'},
    {original: 'peanut butter', substitute: 'soy nut butter', ratio: '1:1'},
  ],
  almonds: [
    {original: 'almonds', substitute: 'sunflower seeds', ratio: '1:1'},
    {original: 'almonds', substitute: 'pumpkin seeds', ratio: '1:1'},
  ],

  // Soy substitutions
  'soy sauce': [
    {original: 'soy sauce', substitute: 'coconut aminos', ratio: '1:1'},
    {original: 'soy sauce', substitute: 'tamari', ratio: '1:1', notes: 'Often gluten-free'},
  ],
  tofu: [
    {original: 'tofu', substitute: 'chickpeas', ratio: '1:1'},
    {original: 'tofu', substitute: 'tempeh', ratio: '1:1', notes: 'Firmer texture'},
  ],

  // Meat substitutions (for vegetarian/vegan)
  beef: [
    {original: 'beef', substitute: 'mushrooms', ratio: '1:1', notes: 'Portobello or cremini'},
    {original: 'beef', substitute: 'lentils', ratio: '1:1', notes: 'For ground beef'},
    {original: 'beef', substitute: 'black beans', ratio: '1:1', notes: 'For burgers'},
  ],
  chicken: [
    {original: 'chicken', substitute: 'tofu', ratio: '1:1'},
    {original: 'chicken', substitute: 'chickpeas', ratio: '1:1'},
    {original: 'chicken', substitute: 'cauliflower', ratio: '1:1', notes: 'For texture'},
  ],
  pork: [
    {original: 'pork', substitute: 'mushrooms', ratio: '1:1'},
    {original: 'pork', substitute: 'jackfruit', ratio: '1:1', notes: 'For pulled pork texture'},
  ],
  fish: [
    {original: 'fish', substitute: 'tofu', ratio: '1:1'},
    {original: 'fish', substitute: 'hearts of palm', ratio: '1:1', notes: 'For fish texture'},
  ],

  // Sugar substitutions (for low-carb/keto)
  sugar: [
    {original: 'sugar', substitute: 'stevia', ratio: '1 tsp stevia = 1 cup sugar'},
    {original: 'sugar', substitute: 'erythritol', ratio: '1:1'},
    {original: 'sugar', substitute: 'monk fruit sweetener', ratio: '1:1'},
  ],
};

export function findSubstitutions(ingredient: string): Substitution[] {
  const lowerIngredient = ingredient.toLowerCase();
  const substitutions: Substitution[] = [];

  // Check each substitution category
  for (const [key, subs] of Object.entries(SUBSTITUTIONS)) {
    if (lowerIngredient.includes(key)) {
      substitutions.push(...subs);
    }
  }

  return substitutions;
}

export function getSubstitutionSuggestion(ingredient: string): string | null {
  const subs = findSubstitutions(ingredient);
  if (subs.length === 0) return null;

  // Return the first (most common) substitution
  const sub = subs[0];
  return `Try ${sub.substitute} (${sub.ratio})${sub.notes ? ` - ${sub.notes}` : ''}`;
}
