/**
 * Test Discord Notifications
 * 
 * This script tests the Discord notification system.
 * Make sure you've set up Discord webhooks in .env first!
 * 
 * Usage: node test-discord-notifications.js
 */

require('dotenv').config();

async function testNotifications() {
  console.log('🧪 Testing Discord Notifications...\n');

  // Check if webhooks are configured
  if (!process.env.DISCORD_ERROR_WEBHOOK) {
    console.log('⚠️  DISCORD_ERROR_WEBHOOK not configured');
    console.log('📝 Follow the setup guide: .kiro/specs/discord-notifications/DISCORD_SETUP_GUIDE.md\n');
    return;
  }

  console.log('✅ Discord webhooks configured');
  console.log(`   Error webhook: ${process.env.DISCORD_ERROR_WEBHOOK.substring(0, 50)}...`);
  if (process.env.DISCORD_FEEDBACK_WEBHOOK) {
    console.log(`   Feedback webhook: ${process.env.DISCORD_FEEDBACK_WEBHOOK.substring(0, 50)}...`);
  }
  if (process.env.DISCORD_ACTIVITY_WEBHOOK) {
    console.log(`   Activity webhook: ${process.env.DISCORD_ACTIVITY_WEBHOOK.substring(0, 50)}...`);
  }
  console.log('');

  // Import services (using dynamic import for ES modules)
  const NotificationService = require('./dist/services/NotificationService').default;

  // Test 1: Error Notification
  console.log('📤 Test 1: Sending error notification...');
  try {
    await NotificationService.sendErrorNotification(
      new Error('Test error from notification system'),
      'high',
      {
        endpoint: '/api/v1/test',
        affectedUsers: 1,
      }
    );
    console.log('✅ Error notification sent!\n');
  } catch (error) {
    console.error('❌ Failed to send error notification:', error.message, '\n');
  }

  // Test 2: Feedback Notification
  if (process.env.DISCORD_FEEDBACK_WEBHOOK) {
    console.log('📤 Test 2: Sending feedback notification...');
    try {
      await NotificationService.sendFeedbackNotification({
        userId: 'test-user-123',
        userName: 'Test User',
        userEmail: 'test@example.com',
        rating: 5,
        category: 'Feature Request',
        message: 'This is a test feedback message from the notification system!',
        timestamp: new Date(),
      });
      console.log('✅ Feedback notification sent!\n');
    } catch (error) {
      console.error('❌ Failed to send feedback notification:', error.message, '\n');
    }
  }

  // Test 3: Activity Notification
  if (process.env.DISCORD_ACTIVITY_WEBHOOK) {
    console.log('📤 Test 3: Sending activity notification...');
    try {
      await NotificationService.sendActivityNotification('signup', {
        signup: {
          userName: 'New Test User',
          userEmail: 'newuser@example.com',
        },
      });
      console.log('✅ Activity notification sent!\n');
    } catch (error) {
      console.error('❌ Failed to send activity notification:', error.message, '\n');
    }
  }

  console.log('🎉 Test complete! Check your Discord channels for notifications.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Verify notifications appeared in Discord');
  console.log('2. Check formatting and colors');
  console.log('3. Start your backend server to enable automatic error notifications');
  console.log('');
}

// Run tests
testNotifications().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
