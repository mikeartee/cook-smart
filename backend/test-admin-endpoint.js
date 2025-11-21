const fetch = require('node-fetch');

async function testEndpoint() {
  try {
    console.log('Testing admin cost endpoint...\n');

    // Test without auth (should fail)
    console.log('1. Testing without authentication:');
    const noAuthResponse = await fetch(
      'http://localhost:3000/api/v1/admin/costs/current',
    );
    const noAuthData = await noAuthResponse.json();
    console.log('Status:', noAuthResponse.status);
    console.log('Response:', noAuthData);

    console.log('\n2. Checking if endpoint exists:');
    console.log('URL: http://localhost:3000/api/v1/admin/costs/current');
    console.log('Expected: 401 Unauthorized (needs admin token)');
    console.log('Got:', noAuthResponse.status, noAuthResponse.statusText);

    if (noAuthResponse.status === 401) {
      console.log('\n✅ Endpoint exists and requires authentication (correct)');
      console.log(
        '\n📝 To test with auth, you need a valid admin token from the app',
      );
    } else if (noAuthResponse.status === 404) {
      console.log('\n❌ Endpoint not found - check route registration');
    } else {
      console.log('\n⚠️  Unexpected response');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEndpoint();
