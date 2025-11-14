exports.seed = async function(knex) {
  await knex('ingredients').del();
  
  const ingredients = [
    // Proteins
    { name: 'Chicken Breast', category: 'proteins', description: 'Boneless, skinless chicken breast', common_names: ['chicken', 'chicken fillet'], nutrition_per_100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 }, default_unit: 'lb', is_common: true },
    { name: 'Ground Beef', category: 'proteins', description: 'Ground beef, 80/20 lean', common_names: ['beef mince', 'hamburger meat'], nutrition_per_100g: { calories: 254, protein: 26, carbs: 0, fat: 17 }, default_unit: 'lb', is_common: true },
    { name: 'Salmon Fillet', category: 'proteins', description: 'Fresh salmon fillet', common_names: ['salmon', 'salmon steak'], nutrition_per_100g: { calories: 208, protein: 25, carbs: 0, fat: 12 }, default_unit: 'lb', is_common: true },
    { name: 'Eggs', category: 'proteins', description: 'Large chicken eggs', common_names: ['egg', 'chicken eggs'], nutrition_per_100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11 }, default_unit: 'piece', is_common: true },
    { name: 'Tofu', category: 'proteins', description: 'Firm tofu', common_names: ['bean curd'], nutrition_per_100g: { calories: 76, protein: 8, carbs: 1.9, fat: 4.8 }, default_unit: 'block', is_common: true },
    { name: 'Shrimp', category: 'proteins', description: 'Raw shrimp, peeled', common_names: ['prawns'], nutrition_per_100g: { calories: 99, protein: 24, carbs: 0.2, fat: 0.3 }, default_unit: 'lb', is_common: true },
    { name: 'Pork Chops', category: 'proteins', description: 'Bone-in pork chops', common_names: ['pork cutlets'], nutrition_per_100g: { calories: 231, protein: 25, carbs: 0, fat: 14 }, default_unit: 'piece', is_common: true },
    { name: 'Turkey Breast', category: 'proteins', description: 'Boneless turkey breast', common_names: ['turkey'], nutrition_per_100g: { calories: 135, protein: 30, carbs: 0, fat: 1 }, default_unit: 'lb', is_common: true },
    { name: 'Tuna', category: 'proteins', description: 'Canned tuna in water', common_names: ['tuna fish'], nutrition_per_100g: { calories: 132, protein: 28, carbs: 0, fat: 1.3 }, default_unit: 'can', is_common: true },
    { name: 'Black Beans', category: 'proteins', description: 'Canned black beans', common_names: ['turtle beans'], nutrition_per_100g: { calories: 132, protein: 8.9, carbs: 23, fat: 0.5 }, default_unit: 'can', is_common: true },

    // Vegetables
    { name: 'Onion', category: 'vegetables', description: 'Yellow onion', common_names: ['yellow onion', 'cooking onion'], nutrition_per_100g: { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 }, default_unit: 'piece', is_common: true },
    { name: 'Garlic', category: 'vegetables', description: 'Fresh garlic bulb', common_names: ['garlic cloves'], nutrition_per_100g: { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 }, default_unit: 'clove', is_common: true },
    { name: 'Tomatoes', category: 'vegetables', description: 'Fresh tomatoes', common_names: ['tomato'], nutrition_per_100g: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 }, default_unit: 'piece', is_common: true },
    { name: 'Bell Peppers', category: 'vegetables', description: 'Red, yellow, or green bell peppers', common_names: ['sweet peppers', 'capsicum'], nutrition_per_100g: { calories: 31, protein: 1, carbs: 7, fat: 0.3 }, default_unit: 'piece', is_common: true },
    { name: 'Carrots', category: 'vegetables', description: 'Fresh carrots', common_names: ['carrot'], nutrition_per_100g: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 }, default_unit: 'piece', is_common: true },
    { name: 'Broccoli', category: 'vegetables', description: 'Fresh broccoli florets', common_names: ['broccoli florets'], nutrition_per_100g: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 }, default_unit: 'head', is_common: true },
    { name: 'Spinach', category: 'vegetables', description: 'Fresh spinach leaves', common_names: ['baby spinach'], nutrition_per_100g: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 }, default_unit: 'bag', is_common: true },
    { name: 'Mushrooms', category: 'vegetables', description: 'White button mushrooms', common_names: ['button mushrooms', 'white mushrooms'], nutrition_per_100g: { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 }, default_unit: 'lb', is_common: true },
    { name: 'Zucchini', category: 'vegetables', description: 'Fresh zucchini', common_names: ['courgette'], nutrition_per_100g: { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 }, default_unit: 'piece', is_common: true },
    { name: 'Potatoes', category: 'vegetables', description: 'Russet potatoes', common_names: ['potato'], nutrition_per_100g: { calories: 77, protein: 2, carbs: 17, fat: 0.1 }, default_unit: 'piece', is_common: true },

    // Fruits
    { name: 'Apples', category: 'fruits', description: 'Fresh apples', common_names: ['apple'], nutrition_per_100g: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 }, default_unit: 'piece', is_common: true },
    { name: 'Bananas', category: 'fruits', description: 'Fresh bananas', common_names: ['banana'], nutrition_per_100g: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 }, default_unit: 'piece', is_common: true },
    { name: 'Lemons', category: 'fruits', description: 'Fresh lemons', common_names: ['lemon'], nutrition_per_100g: { calories: 29, protein: 1.1, carbs: 9, fat: 0.3 }, default_unit: 'piece', is_common: true },
    { name: 'Limes', category: 'fruits', description: 'Fresh limes', common_names: ['lime'], nutrition_per_100g: { calories: 30, protein: 0.7, carbs: 11, fat: 0.2 }, default_unit: 'piece', is_common: true },
    { name: 'Oranges', category: 'fruits', description: 'Fresh oranges', common_names: ['orange'], nutrition_per_100g: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 }, default_unit: 'piece', is_common: true },
    { name: 'Strawberries', category: 'fruits', description: 'Fresh strawberries', common_names: ['strawberry'], nutrition_per_100g: { calories: 32, protein: 0.7, carbs: 8, fat: 0.3 }, default_unit: 'cup', is_common: true },
    { name: 'Blueberries', category: 'fruits', description: 'Fresh blueberries', common_names: ['blueberry'], nutrition_per_100g: { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 }, default_unit: 'cup', is_common: true },
    { name: 'Avocado', category: 'fruits', description: 'Fresh avocado', common_names: ['avocados'], nutrition_per_100g: { calories: 160, protein: 2, carbs: 9, fat: 15 }, default_unit: 'piece', is_common: true },

    // Grains & Starches
    { name: 'Rice', category: 'grains', description: 'White long-grain rice', common_names: ['white rice', 'long grain rice'], nutrition_per_100g: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }, default_unit: 'cup', is_common: true },
    { name: 'Brown Rice', category: 'grains', description: 'Brown long-grain rice', common_names: ['whole grain rice'], nutrition_per_100g: { calories: 111, protein: 2.6, carbs: 23, fat: 0.9 }, default_unit: 'cup', is_common: true },
    { name: 'Pasta', category: 'grains', description: 'Dried pasta', common_names: ['spaghetti', 'noodles'], nutrition_per_100g: { calories: 131, protein: 5, carbs: 25, fat: 1.1 }, default_unit: 'lb', is_common: true },
    { name: 'Bread', category: 'grains', description: 'White sandwich bread', common_names: ['white bread', 'sandwich bread'], nutrition_per_100g: { calories: 265, protein: 9, carbs: 49, fat: 3.2 }, default_unit: 'loaf', is_common: true },
    { name: 'Quinoa', category: 'grains', description: 'Quinoa grain', common_names: ['quinoa grain'], nutrition_per_100g: { calories: 120, protein: 4.4, carbs: 22, fat: 1.9 }, default_unit: 'cup', is_common: true },
    { name: 'Oats', category: 'grains', description: 'Rolled oats', common_names: ['oatmeal', 'rolled oats'], nutrition_per_100g: { calories: 68, protein: 2.4, carbs: 12, fat: 1.4 }, default_unit: 'cup', is_common: true },

    // Dairy
    { name: 'Milk', category: 'dairy', description: 'Whole milk', common_names: ['whole milk'], nutrition_per_100g: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 }, default_unit: 'cup', is_common: true },
    { name: 'Cheese', category: 'dairy', description: 'Cheddar cheese', common_names: ['cheddar', 'sharp cheddar'], nutrition_per_100g: { calories: 403, protein: 25, carbs: 1.3, fat: 33 }, default_unit: 'oz', is_common: true },
    { name: 'Greek Yogurt', category: 'dairy', description: 'Plain Greek yogurt', common_names: ['yogurt', 'greek yoghurt'], nutrition_per_100g: { calories: 59, protein: 10, carbs: 3.6, fat: 0.4 }, default_unit: 'cup', is_common: true },
    { name: 'Butter', category: 'dairy', description: 'Unsalted butter', common_names: ['unsalted butter'], nutrition_per_100g: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 }, default_unit: 'stick', is_common: true },
    { name: 'Cream Cheese', category: 'dairy', description: 'Regular cream cheese', common_names: ['philadelphia cheese'], nutrition_per_100g: { calories: 342, protein: 6, carbs: 4, fat: 34 }, default_unit: 'oz', is_common: true },

    // Spices & Herbs
    { name: 'Salt', category: 'spices', description: 'Table salt', common_names: ['table salt', 'sea salt'], nutrition_per_100g: { calories: 0, protein: 0, carbs: 0, fat: 0 }, default_unit: 'tsp', is_common: true },
    { name: 'Black Pepper', category: 'spices', description: 'Ground black pepper', common_names: ['pepper', 'ground pepper'], nutrition_per_100g: { calories: 251, protein: 10, carbs: 64, fat: 3.3 }, default_unit: 'tsp', is_common: true },
    { name: 'Paprika', category: 'spices', description: 'Ground paprika', common_names: ['sweet paprika'], nutrition_per_100g: { calories: 282, protein: 14, carbs: 54, fat: 13 }, default_unit: 'tsp', is_common: true },
    { name: 'Cumin', category: 'spices', description: 'Ground cumin', common_names: ['cumin powder'], nutrition_per_100g: { calories: 375, protein: 18, carbs: 44, fat: 22 }, default_unit: 'tsp', is_common: true },
    { name: 'Oregano', category: 'spices', description: 'Dried oregano', common_names: ['dried oregano'], nutrition_per_100g: { calories: 265, protein: 9, carbs: 69, fat: 4.3 }, default_unit: 'tsp', is_common: true },
    { name: 'Basil', category: 'spices', description: 'Fresh basil leaves', common_names: ['fresh basil', 'sweet basil'], nutrition_per_100g: { calories: 22, protein: 3.2, carbs: 2.6, fat: 0.6 }, default_unit: 'cup', is_common: true },
    { name: 'Thyme', category: 'spices', description: 'Dried thyme', common_names: ['dried thyme'], nutrition_per_100g: { calories: 276, protein: 9, carbs: 64, fat: 7.4 }, default_unit: 'tsp', is_common: true },
    { name: 'Rosemary', category: 'spices', description: 'Fresh rosemary', common_names: ['fresh rosemary'], nutrition_per_100g: { calories: 131, protein: 3.3, carbs: 20, fat: 5.9 }, default_unit: 'tsp', is_common: true },

    // Condiments & Oils
    { name: 'Olive Oil', category: 'condiments', description: 'Extra virgin olive oil', common_names: ['EVOO', 'extra virgin olive oil'], nutrition_per_100g: { calories: 884, protein: 0, carbs: 0, fat: 100 }, default_unit: 'tbsp', is_common: true },
    { name: 'Vegetable Oil', category: 'condiments', description: 'Neutral cooking oil', common_names: ['cooking oil', 'canola oil'], nutrition_per_100g: { calories: 884, protein: 0, carbs: 0, fat: 100 }, default_unit: 'tbsp', is_common: true },
    { name: 'Soy Sauce', category: 'condiments', description: 'Regular soy sauce', common_names: ['shoyu'], nutrition_per_100g: { calories: 8, protein: 1.3, carbs: 0.8, fat: 0 }, default_unit: 'tbsp', is_common: true },
    { name: 'Vinegar', category: 'condiments', description: 'White vinegar', common_names: ['white vinegar', 'distilled vinegar'], nutrition_per_100g: { calories: 18, protein: 0, carbs: 0.04, fat: 0 }, default_unit: 'tbsp', is_common: true },
    { name: 'Honey', category: 'condiments', description: 'Pure honey', common_names: ['raw honey'], nutrition_per_100g: { calories: 304, protein: 0.3, carbs: 82, fat: 0 }, default_unit: 'tbsp', is_common: true },
    { name: 'Mustard', category: 'condiments', description: 'Yellow mustard', common_names: ['yellow mustard', 'prepared mustard'], nutrition_per_100g: { calories: 66, protein: 4, carbs: 7, fat: 4 }, default_unit: 'tsp', is_common: true },

    // Additional Common Ingredients
    { name: 'Flour', category: 'grains', description: 'All-purpose flour', common_names: ['all purpose flour', 'plain flour'], nutrition_per_100g: { calories: 364, protein: 10, carbs: 76, fat: 1 }, default_unit: 'cup', is_common: true },
    { name: 'Sugar', category: 'condiments', description: 'Granulated white sugar', common_names: ['white sugar', 'granulated sugar'], nutrition_per_100g: { calories: 387, protein: 0, carbs: 100, fat: 0 }, default_unit: 'cup', is_common: true },
    { name: 'Baking Powder', category: 'condiments', description: 'Double-acting baking powder', common_names: ['baking powder'], nutrition_per_100g: { calories: 53, protein: 0, carbs: 28, fat: 0 }, default_unit: 'tsp', is_common: true },
    { name: 'Vanilla Extract', category: 'condiments', description: 'Pure vanilla extract', common_names: ['vanilla'], nutrition_per_100g: { calories: 288, protein: 0.1, carbs: 13, fat: 0.1 }, default_unit: 'tsp', is_common: true }
  ];

  await knex('ingredients').insert(ingredients);
};