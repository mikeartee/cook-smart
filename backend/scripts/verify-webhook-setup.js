/**
 * Verify Stripe Webhook Setup
 * Checks if webhook is configured correctly
 */

require('dotenv').config();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function verifyWebhookSetup() {
  console.log('🔍 Verifying Stripe Webhook Setup...\n');

  try {
    // Check if webhook secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.log('❌ STRIPE_WEBHOOK_SECRET not found in .env');
      console.log('\n📋 To set up webhook:');
      console.log('1. Go to: https://dashboard.stripe.com/test/webhooks');
      console.log('2. Click "Add endpoint"');
      console.log('3. URL: http://localhost:3000/api/webhooks/stripe');
      console.log('4. Select these events:');
      console.log('   - customer.subscription.created');
      console.log('   - customer.subscription.updated');
      console.log('   - customer.subscription.deleted');
      console.log('   - invoice.payment_succeeded');
      console.log('   - invoice.payment_failed');
      console.log('   - customer.subscription.trial_will_end');
      console.log('5. Copy the webhook secret (starts with whsec_)');
      console.log('6. Add to .env: STRIPE_WEBHOOK_SECRET=whsec_...\n');
      return;
    }

    console.log('✅ Webhook secret configured in .env');
    console.log(`   Secret: ${webhookSecret.substring(0, 15)}...`);

    // List webhooks
    console.log('\n🔍 Checking Stripe webhooks...');
    const webhooks = await stripe.webhookEndpoints.list({limit: 10});

    if (webhooks.data.length === 0) {
      console.log('⚠️  No webhooks found in Stripe');
      console.log(
        '\n📋 Create webhook at: https://dashboard.stripe.com/test/webhooks',
      );
    } else {
      console.log(`✅ Found ${webhooks.data.length} webhook(s):\n`);

      webhooks.data.forEach((webhook, index) => {
        console.log(`${index + 1}. ${webhook.url}`);
        console.log(`   Status: ${webhook.status}`);
        console.log(`   Events: ${webhook.enabled_events.length}`);
        console.log(
          `   Created: ${new Date(webhook.created * 1000).toLocaleDateString()}`,
        );

        // Check if it has the required events
        const requiredEvents = [
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed',
          'customer.subscription.trial_will_end',
        ];

        const hasAllEvents = requiredEvents.every(event =>
          webhook.enabled_events.includes(event),
        );

        if (hasAllEvents) {
          console.log('   ✅ All required events configured');
        } else {
          console.log('   ⚠️  Missing some required events');
        }
        console.log('');
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Webhook verification complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error verifying webhook:', error.message);
  }
}

verifyWebhookSetup();
