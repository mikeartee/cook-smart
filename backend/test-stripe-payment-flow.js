#!/usr/bin/env node

/**
 * Stripe Payment Flow Test
 * Tests the complete payment flow with yearly plan (available in beta)
 */

const axios = require('axios');
const Stripe = require('stripe');
require('dotenv').config();

const API_BASE = process.env.API_BASE || 'https://api.cooksmartapp.com';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(STRIPE_SECRET_KEY);

// Test user
const TEST_USER = {
  email: `payment-test-${Date.now()}@cooksmartapp.com`,
  password: 'TestPassword123!',
  firstName: 'Payment',
  lastName: 'Tester',
};

let authToken = null;
let userId = null;

console.log('\n🧪 STRIPE PAYMENT FLOW TEST');
console.log('═'.repeat(60));
console.log(`API Base: ${API_BASE}`);
console.log(`Test User: ${TEST_USER.email}`);
console.log('═'.repeat(60));

/**
 * Step 1: Create and login user
 */
async function setupUser() {
  console.log('\n📝 Step 1: Create Test User');
  console.log('─'.repeat(60));

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

    console.log(`✅ User created: ${userId}`);
    console.log(`   Email: ${TEST_USER.email}`);
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('   User exists, logging in...');

      const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      authToken = loginResponse.data.token;
      userId = loginResponse.data.user.id;

      console.log(`✅ User logged in: ${userId}`);
    } else {
      throw error;
    }
  }
}

/**
 * Step 2: Get available plans
 */
async function getPlans() {
  console.log('\n📋 Step 2: Get Available Plans');
  console.log('─'.repeat(60));

  const response = await axios.get(`${API_BASE}/api/v1/subscriptions/plans`);

  console.log(`✅ Found ${response.data.plans.length} plan(s):`);
  response.data.plans.forEach(plan => {
    console.log(`   - ${plan.displayName}`);
    console.log(
      `     Price: $${plan.initialPrice} (renews at $${plan.renewalPrice})`,
    );
    console.log(`     Interval: ${plan.billingInterval}`);
  });

  return response.data.plans;
}

/**
 * Step 3: Create checkout session
 */
async function createCheckout() {
  console.log('\n💳 Step 3: Create Checkout Session');
  console.log('─'.repeat(60));

  const response = await axios.post(
    `${API_BASE}/api/v1/subscriptions/create-checkout-session`,
    {
      planType: 'yearly', // Use yearly plan (available in beta)
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );

  const sessionId = response.data.sessionId;
  const checkoutUrl = response.data.checkoutUrl;

  console.log(`✅ Checkout session created`);
  console.log(`   Session ID: ${sessionId}`);
  console.log(`   Checkout URL: ${checkoutUrl}`);

  // Get session details from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  console.log(`   Amount: $${(session.amount_total / 100).toFixed(2)}`);
  console.log(`   Currency: ${session.currency.toUpperCase()}`);
  console.log(`   Status: ${session.status}`);

  return {sessionId, checkoutUrl, session};
}

/**
 * Step 4: Display payment instructions
 */
function displayPaymentInstructions(checkoutUrl) {
  console.log('\n🔗 Step 4: Complete Payment');
  console.log('─'.repeat(60));
  console.log('\n📱 MANUAL PAYMENT REQUIRED');
  console.log('\nTo complete this test, you need to:');
  console.log('\n1. Open this URL in your browser:');
  console.log(`   ${checkoutUrl}`);
  console.log('\n2. Complete the payment using:');

  if (STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.log('   Test Card: 4242 4242 4242 4242');
    console.log('   Expiry: Any future date (e.g., 12/34)');
    console.log('   CVC: Any 3 digits (e.g., 123)');
    console.log('   ZIP: Any 5 digits (e.g., 12345)');
  } else {
    console.log('   ⚠️  LIVE MODE - Use a real payment method');
    console.log('   This will charge $24.99 to your card');
  }

  console.log('\n3. After payment, check:');
  console.log('   - Stripe Dashboard for the payment');
  console.log('   - Backend logs for webhook events');
  console.log('   - Database for subscription record');
  console.log('\n4. Run this command to verify subscription:');
  console.log(`   node test-verify-subscription.js ${userId}`);
  console.log('\n');
}

/**
 * Step 5: Check subscription status
 */
async function checkSubscription() {
  console.log('\n📊 Step 5: Check Subscription Status');
  console.log('─'.repeat(60));

  try {
    const response = await axios.get(`${API_BASE}/api/v1/subscriptions/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.data.subscription) {
      const sub = response.data.subscription;
      console.log('✅ Active subscription found:');
      console.log(`   Subscription ID: ${sub.id}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Plan: ${sub.plan_type}`);
      console.log(`   Expires: ${sub.current_period_end}`);
      return true;
    } else {
      console.log('⏳ No active subscription yet');
      console.log('   Payment may still be processing');
      return false;
    }
  } catch (_error) {
    console.log('⏳ No active subscription yet');
    return false;
  }
}

/**
 * Main test flow
 */
async function runTest() {
  try {
    await setupUser();
    await getPlans();
    const {checkoutUrl} = await createCheckout();

    // Check if subscription already exists
    const hasSubscription = await checkSubscription();

    if (!hasSubscription) {
      displayPaymentInstructions(checkoutUrl);
    } else {
      console.log('\n✅ Payment flow test complete!');
      console.log('   Subscription is active');
    }

    console.log('\n📝 Test Account Details:');
    console.log('═'.repeat(60));
    console.log(`Email: ${TEST_USER.email}`);
    console.log(`Password: ${TEST_USER.password}`);
    console.log(`User ID: ${userId}`);
    console.log('═'.repeat(60));
    console.log('\n');
  } catch (testError) {
    console.error(
      '\n❌ Test failed:',
      testError.response?.data || testError.message,
    );
    console.error('\n');
    process.exit(1);
  }
}

runTest();
