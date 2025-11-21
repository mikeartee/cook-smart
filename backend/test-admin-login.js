async function testLogin() {
  try {
    const response = await fetch(
      'http://localhost:3000/api/v1/admin/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123',
        }),
      },
    );

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.token) {
      console.log('\n✅ Login successful!');
      console.log('Token:', data.token.substring(0, 20) + '...');
    } else {
      console.log('\n❌ Login failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Use node-fetch if available, otherwise use native fetch
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testLogin();
