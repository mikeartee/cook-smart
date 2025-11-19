/**
 * Stripe Product Setup Script
 * Creates subscription products and prices in Stripe and stores them in the database
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Stripe = require('stripe');
const {Pool} = require('pg');

// Create database pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {rejectUnauthorized: false},
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  console.log('🚀 Starting Stripe product setup...\n');

  try {
    // 1. Create Yearly Product
    console.log('📦 Creating Yearly subscription product...');
    const yearlyProduct = await stripe.products.create({
      name: 'Cook Smart Premium - Yearly',
      description: 'Annual subscription to Cook Smart Premium features',
      metadata: {
        plan_type: 'yearly',
        billing_interval: 'year',
      },
    });
    console.log(`✅ Yearly product created: ${yearlyProduct.id}`);

    // Create promotional price ($24.99/year)
    const yearlyPromoPrice = await stripe.prices.create({
      product: yearlyProduct.id,
      unit_amount: 2499, // $24.99
      currency: 'usd',
      recurring: {
        interval: 'year',
        interval_count: 1,
      },
      metadata: {
        price_type: 'promotional',
        description: 'Beta/Referral promotional price',
      },
    });
    console.log(
      `✅ Yearly promotional price created: ${yearlyPromoPrice.id} ($24.99)`,
    );

    // Create standard price ($34.99/year)
    const yearlyStandardPrice = await stripe.prices.create({
      product: yearlyProduct.id,
      unit_amount: 3499, // $34.99
      currency: 'usd',
      recurring: {
        interval: 'year',
        interval_count: 1,
      },
      metadata: {
        price_type: 'standard',
        description: 'Standard renewal price',
      },
    });
    console.log(
      `✅ Yearly standard price created: ${yearlyStandardPrice.id} ($34.99)\n`,
    );

    // 2. Create Monthly Product
    console.log('📦 Creating Monthly subscription product...');
    const monthlyProduct = await stripe.products.create({
      name: 'Cook Smart Premium - Monthly',
      description: 'Monthly subscription to Cook Smart Premium features',
      metadata: {
        plan_type: 'monthly',
        billing_interval: 'month',
      },
    });
    console.log(`✅ Monthly product created: ${monthlyProduct.id}`);

    // Create monthly price ($6.99/month)
    const monthlyPrice = await stripe.prices.create({
      product: monthlyProduct.id,
      unit_amount: 699, // $6.99
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      metadata: {
        price_type: 'standard',
        description: 'Standard monthly price',
      },
    });
    console.log(`✅ Monthly price created: ${monthlyPrice.id} ($6.99)\n`);

    // 3. Create Weekly Product
    console.log('📦 Creating Weekly subscription product...');
    const weeklyProduct = await stripe.products.create({
      name: 'Cook Smart Premium - Weekly',
      description: 'Weekly subscription to Cook Smart Premium features',
      metadata: {
        plan_type: 'weekly',
        billing_interval: 'week',
      },
    });
    console.log(`✅ Weekly product created: ${weeklyProduct.id}`);

    // Create weekly price ($2.99/week)
    const weeklyPrice = await stripe.prices.create({
      product: weeklyProduct.id,
      unit_amount: 299, // $2.99
      currency: 'usd',
      recurring: {
        interval: 'week',
        interval_count: 1,
      },
      metadata: {
        price_type: 'standard',
        description: 'Standard weekly price',
      },
    });
    console.log(`✅ Weekly price created: ${weeklyPrice.id} ($2.99)\n`);

    // 4. Store in database
    console.log('💾 Storing product information in database...');

    // Insert yearly plan
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
        yearlyProduct.id,
        yearlyPromoPrice.id,
        yearlyStandardPrice.id,
        'year',
        true, // Available in beta
        0, // No trial in beta
      ],
    );
    console.log('✅ Yearly plan stored in database');

    // Insert monthly plan
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
        monthlyProduct.id,
        null, // No promotional price for monthly
        monthlyPrice.id,
        'month',
        false, // Not available in beta
        7, // 7-day trial post-beta
      ],
    );
    console.log('✅ Monthly plan stored in database');

    // Insert weekly plan
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
        weeklyProduct.id,
        null, // No promotional price for weekly
        weeklyPrice.id,
        'week',
        false, // Not available in beta
        7, // 7-day trial post-beta
      ],
    );
    console.log('✅ Weekly plan stored in database\n');

    // 5. Display summary
    console.log('✨ Setup complete! Here are your Stripe product details:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 YEARLY SUBSCRIPTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Product ID: ${yearlyProduct.id}`);
    console.log(`Promotional Price ID: ${yearlyPromoPrice.id} ($24.99/year)`);
    console.log(`Standard Price ID: ${yearlyStandardPrice.id} ($34.99/year)`);
    console.log('Available: Beta phase\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 MONTHLY SUBSCRIPTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Product ID: ${monthlyProduct.id}`);
    console.log(`Price ID: ${monthlyPrice.id} ($6.99/month)`);
    console.log('Available: Post-beta with 7-day trial\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 WEEKLY SUBSCRIPTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Product ID: ${weeklyProduct.id}`);
    console.log(`Price ID: ${weeklyPrice.id} ($2.99/week)`);
    console.log('Available: Post-beta with 7-day trial\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 NEXT STEPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. ✅ Products created in Stripe');
    console.log('2. ✅ Prices configured');
    console.log('3. ✅ Data stored in database');
    console.log(
      '4. 🔄 Optional: Update .env file with price IDs (for reference)',
    );
    console.log('\nYou can view these products at:');
    console.log('https://dashboard.stripe.com/test/products\n');

    return {
      yearly: {
        productId: yearlyProduct.id,
        promotionalPriceId: yearlyPromoPrice.id,
        standardPriceId: yearlyStandardPrice.id,
      },
      monthly: {
        productId: monthlyProduct.id,
        priceId: monthlyPrice.id,
      },
      weekly: {
        productId: weeklyProduct.id,
        priceId: weeklyPrice.id,
      },
    };
  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupStripeProducts()
    .then(() => {
      console.log('✅ Stripe product setup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = {setupStripeProducts};
