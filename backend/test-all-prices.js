require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testAllPrices() {
  const prices = [
    ['BETA', process.env.STRIPE_BETA_PRICE_ID],
    ['YEARLY', process.env.STRIPE_YEARLY_PRICE_ID],
    ['MONTHLY', process.env.STRIPE_MONTHLY_PRICE_ID],
    ['WEEKLY', process.env.STRIPE_WEEKLY_PRICE_ID],
  ];

  console.log('TESTING ALL PRICE IDS:\n');

  for (const [name, id] of prices) {
    try {
      const price = await stripe.prices.retrieve(id);
      console.log(
        `✅ ${name}: $${price.unit_amount / 100} (${price.recurring.interval})`,
      );
    } catch (err) {
      console.log(`❌ ${name}: INVALID - ${err.message}`);
    }
  }
}

testAllPrices();
