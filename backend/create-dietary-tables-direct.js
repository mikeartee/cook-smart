/**
 * Create Dietary System Tables Directly
 * This bypasses the migration system and creates tables directly
 */

const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.NODE_ENV === 'production' ? {rejectUnauthorized: false} : false,
});

async function createDietaryTables() {
  console.log('🏗️ CREATING DIETARY SYSTEM TABLES DIRECTLY');
  console.log('='.repeat(60));

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create dietary_restrictions table
    console.log('📋 Creating dietary_restrictions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS dietary_restrictions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        excluded_ingredients JSONB DEFAULT '[]'::jsonb,
        excluded_tags JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create allergies table
    console.log('🚨 Creating allergies table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS allergies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        severity VARCHAR(20) DEFAULT 'moderate',
        description TEXT,
        trigger_ingredients JSONB DEFAULT '[]'::jsonb,
        cross_reactive_ingredients JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create user_dietary_restrictions table
    console.log('👤 Creating user_dietary_restrictions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_dietary_restrictions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        restriction_id INTEGER NOT NULL REFERENCES dietary_restrictions(id) ON DELETE CASCADE,
        custom_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, restriction_id)
      )
    `);

    // 4. Create user_allergies table
    console.log('🤧 Creating user_allergies table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_allergies (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        allergy_id INTEGER NOT NULL REFERENCES allergies(id) ON DELETE CASCADE,
        severity_override VARCHAR(20),
        custom_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, allergy_id)
      )
    `);

    // 5. Insert default dietary restrictions
    console.log('📝 Inserting default dietary restrictions...');

    // Check if data already exists
    const existingRestrictions = await client.query(
      'SELECT COUNT(*) FROM dietary_restrictions',
    );
    if (existingRestrictions.rows[0].count === '0') {
      await client.query(`
        INSERT INTO dietary_restrictions (name, category, description, excluded_ingredients) VALUES
        ('Vegetarian', 'diet', 'No meat, poultry, or fish', '["beef", "chicken", "pork", "fish", "meat", "poultry", "turkey", "lamb", "bacon", "ham", "sausage"]'),
        ('Vegan', 'diet', 'No animal products', '["beef", "chicken", "pork", "fish", "meat", "poultry", "turkey", "lamb", "bacon", "ham", "sausage", "milk", "cheese", "butter", "cream", "yogurt", "eggs", "honey"]'),
        ('Gluten-Free', 'diet', 'No gluten-containing grains', '["wheat", "flour", "bread", "pasta", "barley", "rye", "oats", "gluten"]'),
        ('Dairy-Free', 'diet', 'No dairy products', '["milk", "cheese", "butter", "cream", "yogurt", "dairy"]'),
        ('Keto', 'diet', 'Very low carb, high fat', '["bread", "pasta", "rice", "potato", "sugar", "flour"]'),
        ('Paleo', 'diet', 'No processed foods, grains, or legumes', '["bread", "pasta", "rice", "beans", "lentils", "flour", "sugar", "processed"]'),
        ('Low-Sodium', 'health', 'Reduced sodium intake', '["salt", "sodium", "soy sauce", "processed"]'),
        ('Halal', 'religious', 'Islamic dietary laws', '["pork", "bacon", "ham", "alcohol", "wine", "beer"]'),
        ('Kosher', 'religious', 'Jewish dietary laws', '["pork", "bacon", "ham", "shellfish"]')
      `);
    } else {
      console.log('  Dietary restrictions already exist, skipping...');
    }

    // 6. Insert default allergies
    console.log('🚨 Inserting default allergies...');

    // Check if data already exists
    const existingAllergies = await client.query(
      'SELECT COUNT(*) FROM allergies',
    );
    if (existingAllergies.rows[0].count === '0') {
      await client.query(`
        INSERT INTO allergies (name, severity, description, trigger_ingredients) VALUES
        ('Peanut Allergy', 'severe', 'Allergy to peanuts', '["peanut", "peanuts", "peanut butter"]'),
        ('Tree Nut Allergy', 'severe', 'Allergy to tree nuts', '["almond", "walnut", "cashew", "pecan", "pistachio", "hazelnut", "brazil nut", "macadamia"]'),
        ('Dairy Allergy', 'moderate', 'Allergy to dairy products', '["milk", "cheese", "butter", "cream", "yogurt", "dairy", "lactose"]'),
        ('Egg Allergy', 'moderate', 'Allergy to eggs', '["egg", "eggs", "mayonnaise"]'),
        ('Wheat Allergy', 'moderate', 'Allergy to wheat', '["wheat", "flour", "bread", "pasta"]'),
        ('Soy Allergy', 'moderate', 'Allergy to soy products', '["soy", "tofu", "soy sauce", "edamame"]'),
        ('Fish Allergy', 'severe', 'Allergy to fish', '["fish", "salmon", "tuna", "cod", "halibut"]'),
        ('Shellfish Allergy', 'severe', 'Allergy to shellfish', '["shrimp", "crab", "lobster", "oyster", "clam", "mussel"]'),
        ('Sesame Allergy', 'moderate', 'Allergy to sesame', '["sesame", "tahini", "sesame oil"]')
      `);
    } else {
      console.log('  Allergies already exist, skipping...');
    }

    // 7. Create indexes
    console.log('📊 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_dietary_restrictions_user_id ON user_dietary_restrictions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_allergies_user_id ON user_allergies(user_id);
      CREATE INDEX IF NOT EXISTS idx_dietary_restrictions_category ON dietary_restrictions(category);
      CREATE INDEX IF NOT EXISTS idx_allergies_severity ON allergies(severity);
    `);

    await client.query('COMMIT');

    // 8. Verify tables were created
    console.log('\n✅ VERIFICATION:');

    const restrictionsCount = await client.query(
      'SELECT COUNT(*) FROM dietary_restrictions',
    );
    console.log(
      `  • dietary_restrictions: ${restrictionsCount.rows[0].count} records`,
    );

    const allergiesCount = await client.query('SELECT COUNT(*) FROM allergies');
    console.log(`  • allergies: ${allergiesCount.rows[0].count} records`);

    const userRestrictionsCount = await client.query(
      'SELECT COUNT(*) FROM user_dietary_restrictions',
    );
    console.log(
      `  • user_dietary_restrictions: ${userRestrictionsCount.rows[0].count} records`,
    );

    const userAllergiesCount = await client.query(
      'SELECT COUNT(*) FROM user_allergies',
    );
    console.log(
      `  • user_allergies: ${userAllergiesCount.rows[0].count} records`,
    );

    console.log('\n🎉 DIETARY SYSTEM TABLES CREATED SUCCESSFULLY!');
    console.log('✅ Ready for dietary restriction integration');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating dietary tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createDietaryTables().catch(console.error);
