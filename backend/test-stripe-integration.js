#!/usr/bin/env node

/**
 * Comprehensive Stripe Integration Test
 * Tests all Stripe functionality including payments, subscriptions, and webhooks
 */

const axios = require('axios');
const Stripe = require('stripe');
require('dotenv').config();

const API_BASE = process.env.API_BASE || 'https://api.cooksmartapp.com';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY);

// Test user credentials
const TEST_USER = {
  email: `stripe-test-${Date.now()}@cooksmartapp.com`,
  password: 'TestPassword123!',
  firstName: 'Stripe',
  lastName: 'Tester',
};

let authToken = null;
let userId = null;
let checkoutSessionId = null;

/**
 * Test Results Tracker
 */
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function logSuccess(test) {
  console.log(`✅ PASS: ${test}`);
  results.passed.push(test);
}

function logFailure(test, error) {
  console.log(`❌ FAIL: ${test}`);
  console.log(`   Error: ${error.message || error}`);
  results.failed.push({test, error: error.message || error});
}

function logWarning(test, message) {
  console.log(`⚠️  WARN: ${test}`);
  console.log(`   ${message}`);
  results.warnings.push({test, message});
}

/**
 * Test 1: Verify Stripe Configuration
 */
async function testStripeConfiguration() {
  console.log('\n📋 Test 1: Stripe Configuration');
  console.log('═'.repeat(60));

  try {
    // Check if keys are configured
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Verify key format
    if (STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      logWarning('Stripe Configuration', 'Using TEST mode keys');
    } else if (STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      console.log('   Using LIVE mode keys');
    }

    // Test Stripe API connection
    const account = await stripe.accounts.retrieve();
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Account Email: ${account.email || 'Not set'}`);
    console.log(`   Charges Enabled: ${account.charges_enabled}`);
    console.log(`   Payouts Enabled: ${account.payouts_enabled}`);

    logSuccess('Stripe Configuration - API connection verified');
  } catch (error) {
    logFailure('Stripe Configuration', error);
  }
}

/**
 * Test 2: Verify Price IDs
 */
async function testPriceIds() {
  console.log('\n📋 Test 2: Stripe Price IDs');
  console.log('═'.repeat(60));

  const priceIds = {
    BETA: process.env.STRIPE_BETA_PRICE_ID,
    YEARLY: process.env.STRIPE_YEARLY_PRICE_ID,
    MONTHLY: process.env.STRIPE_MONTHLY_PRICE_ID,
    WEEKLY: process.env.STRIPE_WEEKLY_PRICE_ID,
  };

  for (const [name, priceId] of Object.entries(priceIds)) {
    try {
      if (!priceId) {
        logWarning(`Price ID - ${name}`, 'Not configured');
        continue;
      }

      const price = await stripe.prices.retrieve(priceId);
      console.log(`   ${name}: ${priceId}`);
      console.log(`      Amount: $${(price.unit_amount / 100).toFixed(2)}`);
      console.log(`      Currency: ${price.currency.toUpperCase()}`);
      console.log(`      Interval: ${price.recurring?.interval || 'one-time'}`);

      logSuccess(`Price ID - ${name} verified`);
    } catch (error) {
      logFailure(`Price ID - ${name}`, error);
    }
  }
}

/**
 * Test 3: Create Test User
 */
async function testCreateUser() {
  console.log('\n📋 Test 3: Create Test User');
  console.log('═'.repeat(60));

  try {
    const response = await axios.post(`${API_BASE}/api/v1/auth/register`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      first_name: TEST_USER.firstName,
      last_name: TEST_USER.lastName,
      age_verified: true,
    });

    authToken = response.data.token;
    userId = response.data.user.id;

    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);

    logSuccess('Create Test User');
  } catch (error) {
    if (error.response?.status === 409) {
      // User already exists, try to login
      console.log('   User already exists, attempting login...');
      return testLoginUser();
    }
    logFailure('Create Test User', error.response?.data || error);
  }
}

/**
 * Test 4: Login User
 */
async function testLoginUser() {
  console.log('\n📋 Test 4: Login Test User');
  console.log('═'.repeat(60));

  try {
    const response = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    authToken = response.data.token;
    userId = response.data.user.id;

    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);

    logSuccess('Login Test User');
  } catch (error) {
    logFailure('Login Test User', error.response?.data || error);
  }
}

/**
 * Test 5: Get Subscription Plans
 */
async function testGetPlans() {
  console.log('\n📋 Test 5: Get Subscription Plans');
  console.log('═'.repeat(60));

  try {
    const response = await axios.get(`${API_BASE}/api/v1/subscriptions/plans`);

    console.log(`   Found ${response.data.plans.length} plans:`);
    response.data.plans.forEach(plan => {
      console.log(`   - ${plan.displayName}: $${plan.initialPrice}`);
    });

    logSuccess('Get Subscription Plans');
  } catch (error) {
    logFailure('Get Subscription Plans', error.response?.data || error);
  }
}

/**
 * Test 6: Create Checkout Session
 */
async function testCreateCheckoutSession() {
  console.log('\n📋 Test 6: Create Checkout Session');
  console.log('═'.repeat(60));

  if (!authToken) {
    logFailure('Create Checkout Session', 'No auth token available');
    return;
  }

  try {
    const response = await axios.post(
      `${API_BASE}/api/v1/subscriptions/create-checkout-session`,
      {
        planType: 'weekly',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    checkoutSessionId = response.data.sessionId;
    const checkoutUrl = response.data.checkoutUrl;

    console.log(`   Session ID: ${checkoutSessionId}`);
    console.log(`   Checkout URL: ${checkoutUrl}`);

    logSuccess('Create Checkout Session');

    // Retrieve session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
    console.log(`   Amount: $${(session.amount_total / 100).toFixed(2)}`);
    console.log(`   Currency: ${session.currency.toUpperCase()}`);
    console.log(`   Status: ${session.status}`);
  } catch (error) {
    logFailure('Create Checkout Session', error.response?.data || error);
  }
}

/**
 * Test 7: Simulate Payment (Test Mode Only)
 */
async function testSimulatePayment() {
  console.log('\n📋 Test 7: Simulate Payment (Test Mode Only)');
  console.log('═'.repeat(60));

  if (!STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    logWarning(
      'Simulate Payment',
      'Skipped - Only works in test mode. Use real payment in live mode.',
    );
    return;
  }

  if (!checkoutSessionId) {
    logFailure('Simulate Payment', 'No checkout session available');
    return;
  }

  try {
    // In test mode, we can complete the session programmatically
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);

    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent,
      );

      if (paymentIntent.status === 'requires_payment_method') {
        // Attach test payment method
        const paymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: {
            token: 'tok_visa', // Test token
          },
        });

        await stripe.paymentIntents.confirm(paymentIntent.id, {
          payment_method: paymentMethod.id,
        });

        console.log('   Payment simulated successfully');
        logSuccess('Simulate Payment');
      } else {
        console.log(`   Payment Intent Status: ${paymentIntent.status}`);
        logWarning('Simulate Payment', 'Payment already processed or pending');
      }
    }
  } catch (error) {
    logFailure('Simulate Payment', error);
  }
}

/**
 * Test 8: Verify Webhook Endpoint
 */
async function testWebhookEndpoint() {
  console.log('\n📋 Test 8: Verify Webhook Endpoint');
  console.log('═'.repeat(60));

  try {
    // Check if webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logWarning('Webhook Endpoint', 'STRIPE_WEBHOOK_SECRET not configured');
    } else {
      console.log('   Webhook secret configured');
    }

    // List webhooks from Stripe
    const webhooks = await stripe.webhookEndpoints.list();

    console.log(`   Found ${webhooks.data.length} webhook(s):`);
    webhooks.data.forEach(webhook => {
      console.log(`   - ${webhook.url}`);
      console.log(`     Status: ${webhook.status}`);
      console.log(`     Events: ${webhook.enabled_events.join(', ')}`);
    });

    if (webhooks.data.length === 0) {
      logWarning('Webhook Endpoint', 'No webhooks configured in Stripe');
    } else {
      logSuccess('Webhook Endpoint - Found configured webhooks');
    }
  } catch (error) {
    logFailure('Webhook Endpoint', error);
  }
}

/**
 * Test 9: Check User Subscription Status
 */
async function testCheckSubscription() {
  console.log('\n📋 Test 9: Check User Subscription');
  console.log('═'.repeat(60));

  if (!authToken) {
    logFailure('Check User Subscription', 'No auth token available');
    return;
  }

  try {
    const response = await axios.get(`${API_BASE}/api/v1/subscriptions/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.data.subscription) {
      const sub = response.data.subscription;
      console.log(`   Subscription ID: ${sub.id}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Plan: ${sub.plan_type}`);
      console.log(`   Expires: ${sub.current_period_end}`);

      logSuccess('Check User Subscription - Active subscription found');
    } else {
      console.log('   No active subscription');
      logSuccess('Check User Subscription - No subscription (expected)');
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('   No active subscription');
      logSuccess('Check User Subscription - No subscription (expected)');
    } else {
      logFailure('Check User Subscription', error.response?.data || error);
    }
  }
}

/**
 * Test 10: List Stripe Subscriptions
 */
async function testListStripeSubscriptions() {
  console.log('\n📋 Test 10: List Stripe Subscriptions');
  console.log('═'.repeat(60));

  try {
    const subscriptions = await stripe.subscriptions.list({
      limit: 10,
    });

    console.log(`   Found ${subscriptions.data.length} subscription(s):`);
    subscriptions.data.forEach(sub => {
      console.log(`   - ${sub.id}`);
      console.log(`     Status: ${sub.status}`);
      console.log(`     Customer: ${sub.customer}`);
      console.log(
        `     Amount: $${(sub.items.data[0].price.unit_amount / 100).toFixed(2)}`,
      );
    });

    logSuccess('List Stripe Subscriptions');
  } catch (error) {
    logFailure('List Stripe Subscriptions', error);
  }
}

/**
 * Print Final Results
 */
function printResults() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═'.repeat(60));

  console.log(`\n✅ Passed: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`   - ${test}`));

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
    results.warnings.forEach(item => {
      console.log(`   - ${item.test}`);
      console.log(`     ${item.message}`);
    });
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(item => {
      console.log(`   - ${item.test}`);
      console.log(`     ${item.error}`);
    });
  }

  console.log('\n' + '═'.repeat(60));

  const total = results.passed.length + results.failed.length;
  const passRate = ((results.passed.length / total) * 100).toFixed(1);

  console.log(
    `\n📈 Pass Rate: ${passRate}% (${results.passed.length}/${total})`,
  );

  if (results.failed.length === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.');
  }

  console.log('\n');
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log('\n🧪 STRIPE INTEGRATION TEST SUITE');
  console.log('═'.repeat(60));
  console.log(`API Base: ${API_BASE}`);
  console.log(`Test User: ${TEST_USER.email}`);
  console.log('═'.repeat(60));

  try {
    await testStripeConfiguration();
    await testPriceIds();
    await testCreateUser();
    await testGetPlans();
    await testCreateCheckoutSession();
    await testSimulatePayment();
    await testWebhookEndpoint();
    await testCheckSubscription();
    await testListStripeSubscriptions();
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  }

  printResults();
}

// Run tests
runTests().catch(console.error);
