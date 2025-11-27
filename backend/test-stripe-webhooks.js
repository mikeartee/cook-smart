#!/usr/bin/env node

/**
 * Stripe Webhook Testing Script
 * Tests webhook handling by simulating Stripe events
 */

const axios = require('axios');
const Stripe = require('stripe');
require('dotenv').config();

const API_BASE = process.env.API_BASE || 'https://api.cooksmartapp.com';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = new Stripe(STRIPE_SECRET_KEY);

/**
 * Test webhook endpoint accessibility
 */
async function testWebhookEndpoint() {
  console.log('\n📋 Test 1: Webhook Endpoint Accessibility');
  console.log('═'.repeat(60));

  const webhookUrl = `${API_BASE}/api/webhooks/stripe`;
  console.log(`   Webhook URL: ${webhookUrl}`);

  try {
    // Try to access webhook endpoint (should return 400 without signature)
    const response = await axios.post(
      webhookUrl,
      {},
      {
        validateStatus: () => true, // Don't throw on any status
      },
    );

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);

    if (response.status === 400) {
      console.log('   ✅ Webhook endpoint is accessible');
      return true;
    } else {
      console.log('   ⚠️  Unexpected response from webhook endpoint');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Webhook endpoint not accessible');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Create a test event in Stripe
 */
async function createTestEvent(eventType) {
  console.log(`\n📋 Creating test event: ${eventType}`);
  console.log('═'.repeat(60));

  try {
    // Create a test event
    const event = await stripe.events.create({
      type: eventType,
    });

    console.log(`   Event ID: ${event.id}`);
    console.log(`   Type: ${event.type}`);
    console.log(`   Created: ${new Date(event.created * 1000).toISOString()}`);

    return event;
  } catch (error) {
    console.log(`   ❌ Failed to create test event`);
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

/**
 * Send webhook event to local endpoint
 */
async function sendWebhookEvent(event) {
  console.log(`\n📋 Sending webhook event: ${event.type}`);
  console.log('═'.repeat(60));

  const webhookUrl = `${API_BASE}/api/webhooks/stripe`;

  try {
    // Generate webhook signature
    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: WEBHOOK_SECRET,
      timestamp,
    });

    // Send webhook
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
    });

    console.log(`   ✅ Webhook sent successfully`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Failed to send webhook`);
    console.log(`   Error: ${error.response?.data || error.message}`);
    return false;
  }
}

/**
 * Test specific webhook events
 */
async function testWebhookEvents() {
  console.log('\n📋 Testing Webhook Events');
  console.log('═'.repeat(60));

  const events = [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
  ];

  for (const eventType of events) {
    console.log(`\n   Testing: ${eventType}`);

    const event = await createTestEvent(eventType);
    if (event) {
      await sendWebhookEvent(event);
    }

    // Wait a bit between events
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * List recent webhook deliveries from Stripe
 */
async function listWebhookDeliveries() {
  console.log('\n📋 Recent Webhook Deliveries');
  console.log('═'.repeat(60));

  try {
    const webhooks = await stripe.webhookEndpoints.list();

    if (webhooks.data.length === 0) {
      console.log('   No webhooks configured');
      return;
    }

    for (const webhook of webhooks.data) {
      console.log(`\n   Webhook: ${webhook.url}`);
      console.log(`   Status: ${webhook.status}`);

      // Note: Stripe API doesn't provide delivery history directly
      // You need to check Stripe Dashboard → Developers → Webhooks → [endpoint] → Attempts
      console.log('   Check Stripe Dashboard for delivery attempts');
    }
  } catch (error) {
    console.log(`   ❌ Failed to list webhooks`);
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Verify webhook configuration
 */
async function verifyWebhookConfig() {
  console.log('\n📋 Webhook Configuration');
  console.log('═'.repeat(60));

  // Check webhook secret
  if (!WEBHOOK_SECRET) {
    console.log('   ❌ STRIPE_WEBHOOK_SECRET not configured');
    console.log('   Set this in your .env file');
    return false;
  }

  console.log('   ✅ Webhook secret configured');
  console.log(`   Secret: ${WEBHOOK_SECRET.substring(0, 15)}...`);

  // List configured webhooks
  try {
    const webhooks = await stripe.webhookEndpoints.list();

    console.log(`\n   Configured webhooks: ${webhooks.data.length}`);

    webhooks.data.forEach((webhook, index) => {
      console.log(`\n   Webhook ${index + 1}:`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Status: ${webhook.status}`);
      console.log(`   Events: ${webhook.enabled_events.length}`);
      console.log(`   Events: ${webhook.enabled_events.join(', ')}`);
    });

    return webhooks.data.length > 0;
  } catch (error) {
    console.log(`   ❌ Failed to list webhooks`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🧪 STRIPE WEBHOOK TEST SUITE');
  console.log('═'.repeat(60));
  console.log(`API Base: ${API_BASE}`);
  console.log('═'.repeat(60));

  // Verify configuration
  const configOk = await verifyWebhookConfig();

  if (!configOk) {
    console.log(
      '\n⚠️  Webhook not properly configured. Fix configuration first.',
    );
    return;
  }

  // Test endpoint accessibility
  const endpointOk = await testWebhookEndpoint();

  if (!endpointOk) {
    console.log('\n⚠️  Webhook endpoint not accessible. Check server status.');
    return;
  }

  // Test webhook events
  if (STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.log('\n📝 Test mode detected - simulating webhook events');
    await testWebhookEvents();
  } else {
    console.log('\n⚠️  Live mode detected - skipping event simulation');
    console.log('   Use Stripe Dashboard to send test webhooks in live mode');
  }

  // List recent deliveries
  await listWebhookDeliveries();

  console.log('\n✅ Webhook testing complete');
  console.log('\n💡 Next steps:');
  console.log('   1. Check Stripe Dashboard → Developers → Webhooks');
  console.log('   2. Review webhook delivery attempts');
  console.log('   3. Check backend logs for webhook processing');
  console.log('   4. Test with real payment to trigger actual webhooks');
  console.log('\n');
}

// Run tests
runTests().catch(console.error);
