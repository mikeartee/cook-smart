/**
 * Test script for admin authentication endpoints
 * Run with: node test-admin-auth.js
 */

const API_BASE = 'http://localhost:3000/api/v1/admin/auth';

async function testAdminAuth() {
  console.log('🧪 Testing Admin Authentication Endpoints\n');

  try {
    // Test 1: Signup with approved email
    console.log('1️⃣  Testing signup with approved email...');
    const signupResponse = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'tootallgames2020@gmail.com',
        username: 'superadmin',
        password: 'Admin123!',
        name: 'Super Admin',
      }),
    });
    const signupData = await signupResponse.json();
    console.log('   Status:', signupResponse.status);
    console.log('   Response:', signupData);
    console.log('   ✅ Signup test complete\n');

    // Test 2: Login
    console.log('2️⃣  Testing login...');
    const loginResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'superadmin',
        password: 'Admin123!',
      }),
    });
    const loginData = await loginResponse.json();
    console.log('   Status:', loginResponse.status);
    console.log('   Response:', loginData);
    
    if (loginData.token) {
      console.log('   ✅ Login successful - Token received\n');
      
      // Test 3: Get current admin
      console.log('3️⃣  Testing /me endpoint...');
      const meResponse = await fetch(`${API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
        },
      });
      const meData = await meResponse.json();
      console.log('   Status:', meResponse.status);
      console.log('   Response:', meData);
      console.log('   ✅ /me test complete\n');

      // Test 4: Logout
      console.log('4️⃣  Testing logout...');
      const logoutResponse = await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
        },
      });
      const logoutData = await logoutResponse.json();
      console.log('   Status:', logoutResponse.status);
      console.log('   Response:', logoutData);
      console.log('   ✅ Logout test complete\n');
    } else {
      console.log('   ❌ Login failed - No token received\n');
    }

    // Test 5: Signup with unapproved email
    console.log('5️⃣  Testing signup with unapproved email...');
    const unapprovedSignup = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unauthorized@example.com',
        username: 'testuser',
        password: 'Test123!',
        name: 'Test User',
      }),
    });
    const unapprovedData = await unapprovedSignup.json();
    console.log('   Status:', unapprovedSignup.status);
    console.log('   Response:', unapprovedData);
    console.log('   ✅ Unapproved email test complete\n');

    // Test 6: Rate limiting
    console.log('6️⃣  Testing rate limiting (5 failed attempts)...');
    for (let i = 1; i <= 6; i++) {
      const rateLimitResponse = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'wronguser',
          password: 'wrongpass',
        }),
      });
      const rateLimitData = await rateLimitResponse.json();
      console.log(`   Attempt ${i}: Status ${rateLimitResponse.status} - ${rateLimitData.error || rateLimitData.message}`);
    }
    console.log('   ✅ Rate limiting test complete\n');

    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run tests
testAdminAuth();
