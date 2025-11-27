/**
 * Automatically Set Up Stripe Webhook
 * This script creates a webhook endpoint in your Stripe account
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Your backend URL
const BACKEND_URL = 'https://api.cooksmartapp.com';
const WEBHOOK_ENDPOINT = `${BACKEND_URL}/api/webhooks/stripe`;

// Events to listen for
const WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.trial_will_end',
];

async function setupWebhook() {
  console.log('\n🔧 Setting Up Stripe Webhook...\n');
  console.log('Mode:', process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST');
  console.log('Backend URL:', BACKEND_URL);
  console.log('Webhook Endpoint:', WEBHOOK_ENDPOINT);
  console.log('---\n');

  try {
    // Check if webhook already exists
    console.log('📋 Checking for existing webhooks...');
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    
    const existingWebhook = existingWebhooks.data.find(
      webhook => webhook.url === WEBHOOK_ENDPOINT
    );

    if (existingWebhook) {
      console.log('✅ Webhook already exists!');
      console.log(`   ID: ${existingWebhook.id}`);
      console.log(`   Status: ${existingWebhook.status}`);
      console.log(`   Events: ${existingWebhook.enabled_events.length} configured\n`);
      
      console.log('🔑 Webhook Signing Secret:');
      console.log('   Go to Stripe Dashboard to reveal the secret:');
      console.log(`   https://dashboard.stripe.com/webhooks/${existingWebhook.id}\n`);
      
      console.log('⚠️  You need to manually copy the signing secret and add it to .env');
      console.log('   STRIPE_WEBHOOK_SECRET=whsec_...\n');
      return;
    }

    // Create new webhook
    console.log('🆕 Creating new webhook endpoint...');
    const webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_ENDPOINT,
      enabled_events: WEBHOOK_EVENTS,
      description: 'Cook Smart Payment Webhooks',
    });

    console.log('✅ Webhook created successfully!\n');
    console.log('📋 Webhook Details:');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Status: ${webhook.status}`);
    console.log(`   Events: ${webhook.enabled_events.length} configured\n`);

    console.log('🔑 Webhook Signing Secret:');
    console.log(`   ${webhook.secret}\n`);

    // Update .env file
    console.log('📝 Updating .env file...');
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the webhook secret
    if (envContent.includes('STRIPE_WEBHOOK_SECRET=')) {
      envContent = envContent.replace(
        /STRIPE_WEBHOOK_SECRET=.*/,
        `STRIPE_WEBHOOK_SECRET=${webhook.secret}`
      );
    } else {
      envContent += `\nSTRIPE_WEBHOOK_SECRET=${webhook.secret}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated!\n');

    console.log('🎉 Webhook setup complete!\n');
    console.log('📋 Next Steps:');
    console.log('1. ✅ Webhook created in Stripe');
    console.log('2. ✅ Signing secret added to .env');
    console.log('3. ⏳ Restart your backend server');
    console.log('4. ⏳ Test webhook with: stripe trigger customer.subscription.created\n');

    console.log('🔗 View in Stripe Dashboard:');
    console.log(`   https://dashboard.stripe.com/webhooks/${webhook.id}\n`);

  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n⚠️  Authentication failed. Check your STRIPE_SECRET_KEY in .env');
    } else if (error.code === 'url_invalid') {
      console.log('\n⚠️  Invalid webhook URL. Make sure your backend is accessible at:');
      console.log(`   ${WEBHOOK_ENDPOINT}`);
    } else {
      console.log('\n💡 You may need to set up the webhook manually:');
      console.log('1. Go to: https://dashboard.stripe.com/webhooks');
      console.log('2. Click "Add endpoint"');
      console.log(`3. Enter URL: ${WEBHOOK_ENDPOINT}`);
      console.log('4. Select the 6 events listed above');
      console.log('5. Copy the signing secret to .env');
    }
  }
}

setupWebhook();
