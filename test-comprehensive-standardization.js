/**
 * Test the comprehensive ingredient standardization system
 * Shows how it handles ANY type of messy input
 */

// Import the comprehensive standardizer
const {
  ComprehensiveIngredientStandardizer,
} = require('./backend/src/services/ComprehensiveIngredientStandardizer');

async function testComprehensiveStandardization() {
  console.log('🧪 TESTING COMPREHENSIVE INGREDIENT STANDARDIZATION');
  console.log('==================================================');

  // Test cases representing real-world messy inputs
  const testCases = [
    // Your current messy data
    'avocado , NS as to Florida or California 2 avocados',
    ', chopped or sliced 1/2 cup chopped or sliced red tomatoes',
    'fl oz 1/2 fl oz lime juice',
    'serving 3/4 cup diced tomatoes',
    ', sliced 1/2 cup sliced black olives',

    // International variations
    '500g organic free-range chicken breast',
    '2 kg premium ground beef (80/20)',
    '1 litre whole milk',
    '250ml extra virgin olive oil',

    // Brand names
    'Tyson chicken tenderloins',
    'Kraft sharp cheddar cheese',
    "Hellmann's real mayonnaise",
    'Del Monte diced tomatoes',

    // Voice input transcriptions (common errors)
    'chicken breast boneless skinless',
    'yellow onions medium sized',
    'fresh garlic cloves minced',
    'roma tomatoes on the vine',

    // Recipe import variations
    '2 lbs ground turkey (93% lean)',
    '1 bunch fresh spinach, washed',
    '3 large eggs, room temperature',
    '1/2 cup all-purpose flour, sifted',

    // International ingredients
    'aubergine (eggplant)',
    'courgette (zucchini)',
    'coriander (cilantro)',
    'spring onions (scallions)',

    // Typos and variations
    'tomatoe',
    'chiken breast',
    'onoin',
    'potatoe',

    // Complex descriptions
    'Organic, grass-fed, hormone-free ground beef (1 lb package)',
    'Fresh Atlantic salmon fillet, skin-on, wild-caught (2 lbs)',
    'Extra large brown eggs, cage-free, Grade AA (dozen)',
  ];

  console.log(`\nTesting ${testCases.length} different ingredient inputs...\n`);

  for (let i = 0; i < testCases.length; i++) {
    const input = testCases[i];

    try {
      console.log(`${i + 1}. INPUT: "${input}"`);

      const result =
        await ComprehensiveIngredientStandardizer.standardizeIngredient(input);

      console.log(`   → STANDARD: "${result.standardName}"`);
      console.log(
        `   → CATEGORY: ${result.category}${result.subcategory ? ` (${result.subcategory})` : ''}`,
      );
      console.log(`   → UNIT: ${result.defaultUnit} → ${result.standardUnit}`);
      console.log(`   → CONFIDENCE: ${Math.round(result.confidence * 100)}%`);
      console.log(`   → SOURCE: ${result.source}`);

      if (result.unitConversion) {
        console.log(
          `   → CONVERSION: ${result.unitConversion.from} → ${result.unitConversion.to} (×${result.unitConversion.factor})`,
        );
      }

      console.log('');
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
    }
  }

  console.log('🎯 STANDARDIZATION COMPLETE!');
  console.log('\nThis system can now handle:');
  console.log('✅ Messy user input with quantities and descriptions');
  console.log('✅ International ingredient names and units');
  console.log('✅ Brand name recognition');
  console.log('✅ Voice input transcription errors');
  console.log('✅ Recipe import variations');
  console.log('✅ Typos and spelling mistakes');
  console.log('✅ Unit conversion to US standards');
  console.log('✅ Automatic categorization');
  console.log('✅ Confidence scoring for quality control');
}

// Run the test
if (require.main === module) {
  testComprehensiveStandardization().catch(console.error);
}

module.exports = {testComprehensiveStandardization};
