require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testWebhook() {
  console.log('WEBHOOK TEST:\n');

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('⚠️  No webhook secret configured');
  } else {
    console.log('✅ Webhook secret configured');
  }

  try {
    const webhooks = await stripe.webhookEndpoints.list({limit: 5});
    console.log(`✅ ${webhooks.data.length} webhook(s) configured\n`);

    webhooks.data.forEach((w, i) => {
      console.log(`${i + 1}. ${w.url}`);
      console.log(`   Status: ${w.status}`);
      console.log(`   Events: ${w.enabled_events.length}`);
    });
  } catch (err) {
    console.log('❌ Webhook check failed:', err.message);
  }
}

testWebhook();
