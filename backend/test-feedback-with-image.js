const fetch = require('node-fetch');
require('dotenv').config();

// Small test image as base64 (1x1 red pixel PNG)
const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

async function testFeedbackWithImage() {
  try {
    console.log('Testing feedback submission with image...\n');
    
    const response = await fetch('http://localhost:3000/api/v1/feedback/public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'TEST FEEDBACK - This is a test with an image attachment',
        rating: 5,
        category: 'Bug',
        screenshot: testImage,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Feedback submitted successfully!');
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('\n📸 Screenshot was included in the submission');
      console.log('🔍 Check your Discord channel for the notification with image attachment');
    } else {
      console.log('❌ Feedback submission failed');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFeedbackWithImage();

