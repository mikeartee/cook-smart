/**
 * Check Stripe Webhooks Configuration
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkWebhooks() {
  console.log('\n🔍 Checking Stripe Webhooks...\n');
  console.log('Mode:', process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST');
  console.log('---\n');

  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    
    if (webhooks.data.length === 0) {
      console.log('❌ No webhooks configured\n');
      console.log('You need to create a webhook endpoint:');
      console.log('1. Go to: https://dashboard.stripe.com/webhooks');
      console.log('2. Click "Add endpoint"');
      console.log('3. Enter your backend URL + /api/webhooks/stripe');
      console.log('   Example: https://your-backend.com/api/webhooks/stripe');
      console.log('4. Select these events:');
      console.log('   - customer.subscription.created');
      console.log('   - customer.subscription.updated');
      console.log('   - customer.subscription.deleted');
      console.log('   - invoice.payment_succeeded');
      console.log('   - invoice.payment_failed');
      console.log('   - customer.subscription.trial_will_end');
      console.log('5. Copy the signing secret (starts with whsec_)');
      console.log('6. Add to backend/.env as STRIPE_WEBHOOK_SECRET\n');
      return;
    }

    console.log(`✅ Found ${webhooks.data.length} webhook(s):\n`);

    for (const webhook of webhooks.data) {
      console.log(`🔗 ${webhook.url}`);
      console.log(`   Status: ${webhook.status}`);
      console.log(`   ID: ${webhook.id}`);
      console.log(`   Events: ${webhook.enabled_events.length} configured`);
      console.log(`   Events:`);
      webhook.enabled_events.forEach(event => {
        console.log(`     - ${event}`);
      });
      console.log('');
    }

    console.log('\n📋 Current .env configuration:');
    console.log('---');
    console.log('STRIPE_WEBHOOK_SECRET=', process.env.STRIPE_WEBHOOK_SECRET || '❌ NOT SET');
    console.log('---\n');

    if (process.env.STRIPE_WEBHOOK_SECRET === 'whsec_your_webhook_secret_here') {
      console.log('⚠️  Webhook secret is placeholder - update with real secret from Stripe Dashboard\n');
    } else if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('⚠️  Webhook secret not set - webhooks will not work\n');
    } else {
      console.log('✅ Webhook secret is configured\n');
    }

  } catch (error) {
    console.error('❌ Error checking webhooks:', error.message);
  }
}

checkWebhooks();
