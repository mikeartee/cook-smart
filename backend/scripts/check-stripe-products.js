/**
 * Check Stripe Products and Price IDs
 * This script lists all products and prices in your Stripe account
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkStripeProducts() {
  console.log('\n🔍 Checking Stripe Products...\n');
  console.log('Mode:', process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST');
  console.log('---\n');

  try {
    // List all products
    const products = await stripe.products.list({ limit: 100, active: true });
    
    if (products.data.length === 0) {
      console.log('❌ No products found in Stripe account');
      console.log('\nYou need to create products in Stripe Dashboard:');
      console.log('https://dashboard.stripe.com/products\n');
      return;
    }

    console.log(`✅ Found ${products.data.length} products:\n`);

    for (const product of products.data) {
      console.log(`📦 ${product.name}`);
      console.log(`   ID: ${product.id}`);
      
      // Get prices for this product
      const prices = await stripe.prices.list({ product: product.id, active: true });
      
      if (prices.data.length > 0) {
        for (const price of prices.data) {
          const amount = (price.unit_amount / 100).toFixed(2);
          const interval = price.recurring ? price.recurring.interval : 'one-time';
          console.log(`   💰 Price: $${amount} / ${interval}`);
          console.log(`   🔑 Price ID: ${price.id}`);
        }
      } else {
        console.log('   ⚠️  No prices found for this product');
      }
      console.log('');
    }

    console.log('\n📋 Current .env configuration:');
    console.log('---');
    console.log('STRIPE_BETA_PRICE_ID=', process.env.STRIPE_BETA_PRICE_ID || '❌ NOT SET');
    console.log('STRIPE_YEARLY_REFERRAL_PRICE_ID=', process.env.STRIPE_YEARLY_REFERRAL_PRICE_ID || '❌ NOT SET');
    console.log('STRIPE_YEARLY_PRICE_ID=', process.env.STRIPE_YEARLY_PRICE_ID || '❌ NOT SET');
    console.log('STRIPE_MONTHLY_PRICE_ID=', process.env.STRIPE_MONTHLY_PRICE_ID || '❌ NOT SET');
    console.log('STRIPE_WEEKLY_PRICE_ID=', process.env.STRIPE_WEEKLY_PRICE_ID || '❌ NOT SET');
    console.log('STRIPE_WEBHOOK_SECRET=', process.env.STRIPE_WEBHOOK_SECRET || '❌ NOT SET');
    console.log('---\n');

    console.log('💡 Next steps:');
    console.log('1. Copy the Price IDs above');
    console.log('2. Update backend/.env with the correct price IDs');
    console.log('3. Match each price to the correct plan (weekly, monthly, yearly, etc.)');
    console.log('4. Restart your backend server\n');

  } catch (error) {
    console.error('❌ Error checking Stripe products:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n⚠️  Authentication failed. Check your STRIPE_SECRET_KEY in .env');
    }
  }
}

checkStripeProducts();
