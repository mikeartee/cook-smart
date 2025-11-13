# Cook Smart - Comprehensive Ingredient Database Plan

## Database Structure

### Core Ingredients Table
- **ID**: Unique identifier
- **Name**: Primary ingredient name
- **Category**: Protein, Vegetable, Fruit, Grain, Dairy, Spice, Condiment, etc.
- **Subcategory**: Beef, Chicken, Leafy Greens, Citrus, etc.
- **Common_names**: JSON array of alternate names/synonyms
- **Barcode_matches**: Associated UPC codes (if available)

### Categories (500+ Ingredients)

**Proteins (50+ items)**
- Beef: Ground beef, Steak, Roast, etc.
- Chicken: Breast, Thigh, Wings, Ground, etc.
- Pork: Chops, Ground, Bacon, Ham, etc.
- Fish: Salmon, Tuna, Cod, Shrimp, etc.
- Plant-based: Tofu, Tempeh, Beans, Lentils, etc.

**Vegetables (100+ items)**
- Leafy Greens: Spinach, Lettuce, Kale, Arugula, etc.
- Root Vegetables: Carrots, Potatoes, Onions, Garlic, etc.
- Cruciferous: Broccoli, Cauliflower, Brussels sprouts, etc.
- Peppers: Bell peppers, Jalapeños, etc.
- Tomatoes: Fresh, Canned, Paste, etc.

**Fruits (75+ items)**
- Citrus: Lemons, Limes, Oranges, etc.
- Berries: Strawberries, Blueberries, Raspberries, etc.
- Stone Fruits: Peaches, Plums, Cherries, etc.
- Tropical: Bananas, Pineapple, Mango, etc.
- Apples: Various varieties

**Grains & Starches (50+ items)**
- Rice: White, Brown, Jasmine, Basmati, etc.
- Pasta: Spaghetti, Penne, Lasagna sheets, etc.
- Bread: White, Wheat, Sourdough, etc.
- Flour: All-purpose, Wheat, Almond, etc.
- Quinoa, Oats, Barley, etc.

**Dairy & Alternatives (40+ items)**
- Milk: Whole, 2%, Skim, Almond, Oat, etc.
- Cheese: Cheddar, Mozzarella, Parmesan, etc.
- Yogurt: Greek, Regular, Flavored, etc.
- Butter, Cream, Sour cream, etc.

**Spices & Herbs (75+ items)**
- Basic: Salt, Pepper, Garlic powder, etc.
- Herbs: Basil, Oregano, Thyme, Rosemary, etc.
- International: Cumin, Paprika, Turmeric, etc.
- Blends: Italian seasoning, Taco seasoning, etc.

**Condiments & Sauces (50+ items)**
- Basic: Ketchup, Mustard, Mayo, etc.
- International: Soy sauce, Hot sauce, BBQ sauce, etc.
- Oils: Olive oil, Vegetable oil, Coconut oil, etc.
- Vinegars: Balsamic, Apple cider, White, etc.

**Pantry Staples (50+ items)**
- Canned goods: Tomatoes, Beans, Broth, etc.
- Baking: Sugar, Baking powder, Vanilla, etc.
- Nuts & Seeds: Almonds, Walnuts, Sunflower seeds, etc.

## User Experience Features

### Search & Selection
- **Autocomplete search** - Type "chick" → suggests "Chicken breast", "Chickpeas", etc.
- **Category browsing** - Browse by food type
- **Recently used** - Quick access to frequently selected ingredients
- **Custom additions** - "Add Custom Ingredient" button always visible

### Custom Ingredient System
- **User-specific** - Custom ingredients saved per user
- **Reusable** - Once added, appears in their future selections
- **Categorizable** - Users can assign category to custom ingredients
- **Shareable** - Option to suggest custom ingredients to ingredient database

### Smart Matching
- **Synonym support** - "Scallions" matches "Green onions"
- **Partial matching** - Recipe calls for "Roma tomatoes", user has "Tomatoes"
- **Brand flexibility** - "Kraft cheese" matches "Cheddar cheese"

## Implementation Priority

### Phase 1: Core Database (300+ most common ingredients)
- Essential proteins, vegetables, fruits, grains
- Basic spices and condiments
- Common dairy items

### Phase 2: Expansion (200+ additional ingredients)
- Specialty items, international ingredients
- More spice varieties, ethnic foods
- Organic/alternative versions

### Phase 3: User-Driven Growth
- Custom ingredient suggestions from users
- Popular additions promoted to main database
- Regional ingredient variations

## Technical Considerations

### Database Optimization
- **Indexed search** - Fast autocomplete performance
- **Categorized queries** - Efficient category filtering
- **Synonym matching** - Quick alternate name lookups

### Maintenance
- **Admin tools** - Add/edit ingredients via admin dashboard
- **User feedback** - Report missing ingredients
- **Analytics** - Track most requested custom ingredients

This comprehensive approach ensures users can find virtually any ingredient they have, while maintaining the flexibility to add anything we missed.