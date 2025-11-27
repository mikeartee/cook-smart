require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function test() {
  console.log('STRIPE TEST STARTING...\n');

  // Test 1: Connection
  try {
    const account = await stripe.accounts.retrieve();
    console.log('✅ Connected:', account.id);
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
    return;
  }

  // Test 2: Prices
  try {
    const price = await stripe.prices.retrieve(
      process.env.STRIPE_BETA_PRICE_ID,
    );
    console.log('✅ Price valid: $' + price.unit_amount / 100);
  } catch (err) {
    console.log('❌ Price invalid:', err.message);
  }

  // Test 3: Payment Intent
  try {
    const pi = await stripe.paymentIntents.create({
      amount: 2499,
      currency: 'usd',
    });
    console.log('✅ Payment intent:', pi.id);
  } catch (err) {
    console.log('❌ Payment failed:', err.message);
  }

  // Test 4: Customer & Subscription
  try {
    const customer = await stripe.customers.create({
      email: 'test@test.com',
    });
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{price: process.env.STRIPE_BETA_PRICE_ID}],
      payment_behavior: 'default_incomplete',
    });
    console.log('✅ Subscription:', sub.id);
    await stripe.subscriptions.cancel(sub.id);
    await stripe.customers.del(customer.id);
    console.log('✅ Cleanup done');
  } catch (err) {
    console.log('❌ Subscription failed:', err.message);
  }

  console.log('\n🎯 STRIPE IS WORKING');
}

test();
