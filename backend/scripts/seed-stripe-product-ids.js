/**
 * Seed Stripe Product IDs into Database
 * Run this after migrations to populate subscription_plans table
 */

require('dotenv').config();
const {Pool} = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {rejectUnauthorized: false},
});

// Product IDs from the setup script
const STRIPE_PRODUCTS = {
  yearly: {
    productId: 'prod_TR678Y0C2IDM8B',
    promotionalPriceId: 'price_1SUDvO3RlxEWosqc4NHgVT6H',
    standardPriceId: 'price_1SUDvP3RlxEWosqcKrhlbeUo',
  },
  monthly: {
    productId: 'prod_TR67Z7wh1hRKlS',
    priceId: 'price_1SUDvP3RlxEWosqc4gQ6XCxp',
  },
  weekly: {
    productId: 'prod_TR67iYCWsjxQRT',
    priceId: 'price_1SUDvP3RlxEWosqcipmnKKex',
  },
};

async function seedProductIds() {
  console.log('🌱 Seeding Stripe product IDs into database...\n');

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Insert yearly plan
    console.log('📦 Inserting yearly plan...');
    await pool.query(
      `
      INSERT INTO subscription_plans (
        plan_name, stripe_product_id, promotional_price_id, 
        standard_price_id, billing_interval, available_in_beta, trial_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (plan_name) DO UPDATE SET
        stripe_product_id = EXCLUDED.stripe_product_id,
        promotional_price_id = EXCLUDED.promotional_price_id,
        standard_price_id = EXCLUDED.standard_price_id,
        updated_at = CURRENT_TIMESTAMP
    `,
      [
        'yearly',
        STRIPE_PRODUCTS.yearly.productId,
        STRIPE_PRODUCTS.yearly.promotionalPriceId,
        STRIPE_PRODUCTS.yearly.standardPriceId,
        'year',
        true, // Available in beta
        0, // No trial in beta
      ],
    );
    console.log('✅ Yearly plan inserted\n');

    // Insert monthly plan
    console.log('📦 Inserting monthly plan...');
    await pool.query(
      `
      INSERT INTO subscription_plans (
        plan_name, stripe_product_id, promotional_price_id, 
        standard_price_id, billing_interval, available_in_beta, trial_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (plan_name) DO UPDATE SET
        stripe_product_id = EXCLUDED.stripe_product_id,
        standard_price_id = EXCLUDED.standard_price_id,
        updated_at = CURRENT_TIMESTAMP
    `,
      [
        'monthly',
        STRIPE_PRODUCTS.monthly.productId,
        null, // No promotional price
        STRIPE_PRODUCTS.monthly.priceId,
        'month',
        false, // Not available in beta
        7, // 7-day trial post-beta
      ],
    );
    console.log('✅ Monthly plan inserted\n');

    // Insert weekly plan
    console.log('📦 Inserting weekly plan...');
    await pool.query(
      `
      INSERT INTO subscription_plans (
        plan_name, stripe_product_id, promotional_price_id, 
        standard_price_id, billing_interval, available_in_beta, trial_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (plan_name) DO UPDATE SET
        stripe_product_id = EXCLUDED.stripe_product_id,
        standard_price_id = EXCLUDED.standard_price_id,
        updated_at = CURRENT_TIMESTAMP
    `,
      [
        'weekly',
        STRIPE_PRODUCTS.weekly.productId,
        null, // No promotional price
        STRIPE_PRODUCTS.weekly.priceId,
        'week',
        false, // Not available in beta
        7, // 7-day trial post-beta
      ],
    );
    console.log('✅ Weekly plan inserted\n');

    // Verify
    const result = await pool.query(
      'SELECT * FROM subscription_plans ORDER BY id',
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Subscription Plans in Database:\n');
    result.rows.forEach(row => {
      console.log(`   ${row.plan_name.toUpperCase()}`);
      console.log(`   Product: ${row.stripe_product_id}`);
      console.log(`   Standard Price: ${row.standard_price_id}`);
      if (row.promotional_price_id) {
        console.log(`   Promo Price: ${row.promotional_price_id}`);
      }
      console.log(`   Available in Beta: ${row.available_in_beta}`);
      console.log(`   Trial Days: ${row.trial_days}`);
      console.log('');
    });

    console.log('✅ All product IDs seeded successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding product IDs:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed
if (require.main === module) {
  seedProductIds()
    .then(() => {
      console.log('✅ Seed process completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

module.exports = {seedProductIds};
