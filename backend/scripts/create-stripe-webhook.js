/**
 * Create Stripe Webhook Endpoint
 * Automatically creates webhook with all required events
 */

require('dotenv').config();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Your webhook URL (update for production)
const WEBHOOK_URL =
  process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/stripe';

// Required events for subscription system
const REQUIRED_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.trial_will_end',
];

async function createWebhook() {
  console.log('🚀 Creating Stripe Webhook Endpoint...\n');
  console.log(`📍 URL: ${WEBHOOK_URL}\n`);

  try {
    // Check if webhook already exists
    const existingWebhooks = await stripe.webhookEndpoints.list({limit: 10});
    const existing = existingWebhooks.data.find(wh => wh.url === WEBHOOK_URL);

    if (existing) {
      console.log('⚠️  Webhook already exists!');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Status: ${existing.status}`);
      console.log(`   Events: ${existing.enabled_events.length}`);

      // Check if it has all required events
      const hasAllEvents = REQUIRED_EVENTS.every(event =>
        existing.enabled_events.includes(event),
      );

      if (hasAllEvents) {
        console.log('\n✅ Webhook is already configured correctly!');
        console.log(`\n🔑 Webhook Secret: ${existing.secret}`);
        console.log('\nAdd this to your .env file:');
        console.log(`STRIPE_WEBHOOK_SECRET=${existing.secret}\n`);
      } else {
        console.log('\n⚠️  Webhook exists but missing some events.');
        console.log('   Consider updating it in Stripe Dashboard.\n');
      }
      return;
    }

    // Create new webhook
    console.log('📝 Creating webhook with events:');
    REQUIRED_EVENTS.forEach(event => console.log(`   - ${event}`));
    console.log('');

    const webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: REQUIRED_EVENTS,
      description: 'Cook Smart Subscription System',
    });

    console.log('✅ Webhook created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Webhook Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${webhook.id}`);
    console.log(`URL: ${webhook.url}`);
    console.log(`Status: ${webhook.status}`);
    console.log(`Events: ${webhook.enabled_events.length}`);
    console.log('');
    console.log('🔑 Webhook Secret:');
    console.log(`${webhook.secret}`);
    console.log('');
    console.log('📝 Add this to your .env file:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    console.log('');
    console.log('✅ Webhook setup complete!\n');
  } catch (error) {
    console.error('❌ Error creating webhook:', error.message);

    if (error.message.includes('url')) {
      console.log(
        '\n💡 Tip: Make sure your webhook URL is publicly accessible.',
      );
      console.log('   For local testing, use Stripe CLI:');
      console.log(
        '   stripe listen --forward-to localhost:3000/api/webhooks/stripe\n',
      );
    }
  }
}

createWebhook();
