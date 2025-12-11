/**
 * Migration script to standardize existing messy ingredients in user_ingredients table
 *
 * This script will:
 * 1. Read all existing user ingredients with messy names
 * 2. Standardize them using the IngredientStandardizationService
 * 3. Update the database with clean, standardized names
 * 4. Add proper categories where missing
 */

const {Pool} = require('pg');
require('dotenv').config();

// Import our standardization service
const {
  IngredientStandardizationService,
} = require('./src/services/IngredientStandardizationService');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.NODE_ENV === 'production' ? {rejectUnauthorized: false} : false,
});

async function standardizeExistingIngredients() {
  console.log('🔧 Starting ingredient standardization migration...');

  try {
    // Get all user ingredients with messy names
    const result = await pool.query(`
      SELECT id, user_id, name, category, quantity, unit
      FROM user_ingredients 
      WHERE name IS NOT NULL 
      ORDER BY id
    `);

    console.log(`📊 Found ${result.rows.length} ingredients to standardize`);

    let updated = 0;
    let errors = 0;

    for (const row of result.rows) {
      try {
        console.log(`\n🔍 Processing: "${row.name}"`);

        // Standardize the ingredient
        const standardized =
          await IngredientStandardizationService.standardizeIngredient(
            row.name,
          );

        console.log(
          `   → Standardized: "${standardized.standardName}" (${standardized.category})`,
        );
        console.log(
          `   → Confidence: ${Math.round(standardized.confidence * 100)}%`,
        );

        // Update the database with standardized data
        await pool.query(
          `
          UPDATE user_ingredients 
          SET 
            name = $1,
            category = $2,
            updated_at = NOW()
          WHERE id = $3
        `,
          [standardized.standardName, standardized.category, row.id],
        );

        updated++;

        if (updated % 10 === 0) {
          console.log(
            `\n✅ Progress: ${updated}/${result.rows.length} ingredients updated`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing ingredient "${row.name}":`,
          error.message,
        );
        errors++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`   ✅ Updated: ${updated} ingredients`);
    console.log(`   ❌ Errors: ${errors} ingredients`);
    console.log(
      `   📊 Success rate: ${Math.round((updated / result.rows.length) * 100)}%`,
    );

    // Show some examples of the standardization
    console.log(`\n📋 Sample standardized ingredients:`);
    const sampleResult = await pool.query(`
      SELECT name, category 
      FROM user_ingredients 
      WHERE category IS NOT NULL 
      ORDER BY updated_at DESC 
      LIMIT 10
    `);

    sampleResult.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.name} (${row.category})`);
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  standardizeExistingIngredients();
}

module.exports = {standardizeExistingIngredients};
