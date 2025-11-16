/**
 * Test All Discord Notifications
 * 
 * This script tests all three types of Discord notifications.
 * Run: node test-all-notifications.js
 */

const fetch = require('node-fetch');

const ERROR_WEBHOOK = process.env.DISCORD_ERROR_WEBHOOK || 'https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD';
const FEEDBACK_WEBHOOK = process.env.DISCORD_FEEDBACK_WEBHOOK || 'https://discord.com/api/webhooks/1436216941005111427/nRFnSFRtBZXeHfIuC9Ld2xOPkapaTA-K5hY4lt2PJ8FDQq5BHWc7nuO2nBbl--LnggIB';
const ACTIVITY_WEBHOOK = process.env.DISCORD_ACTIVITY_WEBHOOK || 'https://discord.com/api/webhooks/1437221881836081284/GC7nJ6n_MM9YusHhLwTw-RVEyizVVM6CDRt6tVnP_qW2OSgD07VBzR8q5Y2M0BSdCNkW';

async function testErrorNotification() {
  console.log('📤 Test 1: Sending ERROR notification...');
  
  const embed = {
    embeds: [{
      title: '🚨 TEST ERROR NOTIFICATION',
      color: 15158332, // Red
      fields: [
        { name: 'Severity', value: '🚨 HIGH', inline: true },
        { name: 'Time', value: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC', inline: true },
        { name: 'Endpoint', value: 'GET /api/v1/test', inline: true },
        { name: 'Error', value: 'This is a test error from the notification system', inline: false },
        { name: 'Affected Users', value: '1', inline: true },
        { name: 'Status', value: 'Test - No action needed', inline: true },
      ],
      footer: { text: 'Cook Smart Error Monitor - TEST' },
      timestamp: new Date().toISOString(),
    }]
  };

  try {
    const response = await fetch(ERROR_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });

    if (response.ok) {
      console.log('✅ Error notification sent!\n');
    } else {
      console.error('❌ Failed:', response.status, response.statusText, '\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
  }
}

async function testFeedbackNotification() {
  console.log('📤 Test 2: Sending FEEDBACK notification...');
  
  const embed = {
    embeds: [{
      title: '💬 TEST FEEDBACK',
      color: 3447003, // Blue
      fields: [
        { name: 'User', value: 'Test User (test@example.com)', inline: false },
        { name: 'Rating', value: '⭐⭐⭐⭐⭐', inline: true },
        { name: 'Category', value: 'Feature Request', inline: true },
        { name: 'Time', value: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC', inline: true },
        { name: 'Message', value: 'This is a test feedback message! The Discord notifications system is working great! 🎉', inline: false },
      ],
      footer: { text: 'Cook Smart Feedback - TEST' },
      timestamp: new Date().toISOString(),
    }]
  };

  try {
    const response = await fetch(FEEDBACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });

    if (response.ok) {
      console.log('✅ Feedback notification sent!\n');
    } else {
      console.error('❌ Failed:', response.status, response.statusText, '\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
  }
}

async function testActivityNotification() {
  console.log('📤 Test 3: Sending ACTIVITY notification...');
  
  const embed = {
    embeds: [{
      title: '👤 TEST USER SIGNUP',
      color: 5763719, // Green
      fields: [
        { name: 'Name', value: 'Test User', inline: true },
        { name: 'Email', value: 'testuser@example.com', inline: true },
        { name: 'Time', value: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC', inline: true },
        { name: 'Source', value: 'Direct signup (TEST)', inline: false },
      ],
      footer: { text: 'Cook Smart Activity - TEST' },
      timestamp: new Date().toISOString(),
    }]
  };

  try {
    const response = await fetch(ACTIVITY_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });

    if (response.ok) {
      console.log('✅ Activity notification sent!\n');
    } else {
      console.error('❌ Failed:', response.status, response.statusText, '\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
  }
}

async function runAllTests() {
  console.log('🧪 Testing All Discord Notifications\n');
  console.log('=' .repeat(50));
  console.log('\n');

  await testErrorNotification();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testFeedbackNotification();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testActivityNotification();

  console.log('=' .repeat(50));
  console.log('\n🎉 All tests complete!');
  console.log('\nCheck your Discord channels:');
  console.log('  - #errors (or crash dump channel)');
  console.log('  - #feedback (or user feedback channel)');
  console.log('  - #activity (or user actions channel)');
  console.log('\nYou should see 3 test notifications! ✨\n');
}

runAllTests().catch(console.error);
