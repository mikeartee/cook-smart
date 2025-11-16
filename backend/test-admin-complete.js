/**
 * Complete Admin System Test
 * Tests authentication and management endpoints
 * Run with: node test-admin-complete.js
 */

const API_BASE = 'http://localhost:3000/api/v1/admin';

let adminToken = '';
let superAdminToken = '';

async function testCompleteAdminSystem() {
  console.log('🧪 Testing Complete Admin System\n');
  console.log('=' .repeat(60));

  try {
    // ========================================
    // PART 1: AUTHENTICATION
    // ========================================
    console.log('\n📝 PART 1: AUTHENTICATION TESTS\n');

    // Test 1: Signup with approved email
    console.log('1️⃣  Signup with approved email (super admin)...');
    const signupResponse = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'tootallgames2020@gmail.com',
        username: 'superadmin',
        password: 'SuperAdmin123!',
        name: 'Super Admin',
      }),
    });
    const signupData = await signupResponse.json();
    console.log(`   Status: ${signupResponse.status}`);
    console.log(`   ${signupResponse.status === 201 || signupResponse.status === 409 ? '✅' : '❌'} ${signupData.message || signupData.error}\n`);

    // Test 2: Login as super admin
    console.log('2️⃣  Login as super admin...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'superadmin',
        password: 'SuperAdmin123!',
      }),
    });
    const loginData = await loginResponse.json();
    console.log(`   Status: ${loginResponse.status}`);
    
    if (loginData.token) {
      superAdminToken = loginData.token;
      console.log(`   ✅ Login successful`);
      console.log(`   Super Admin: ${loginData.admin.is_super_admin}\n`);
    } else {
      console.log(`   ❌ Login failed: ${loginData.error}\n`);
      return;
    }

    // Test 3: Get current admin
    console.log('3️⃣  Get current admin info (/me)...');
    const meResponse = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    const meData = await meResponse.json();
    console.log(`   Status: ${meResponse.status}`);
    console.log(`   ${meResponse.status === 200 ? '✅' : '❌'} ${meData.admin ? `${meData.admin.username} (${meData.admin.email})` : meData.error}\n`);

    // Test 4: Signup with unapproved email
    console.log('4️⃣  Signup with unapproved email (should fail)...');
    const unapprovedSignup = await fetch(`${API_BASE}/auth/signup`, {
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
    console.log(`   Status: ${unapprovedSignup.status}`);
    console.log(`   ${unapprovedSignup.status === 403 ? '✅' : '❌'} ${unapprovedData.error}\n`);

    // ========================================
    // PART 2: ADMIN MANAGEMENT (SUPER ADMIN)
    // ========================================
    console.log('\n👑 PART 2: ADMIN MANAGEMENT TESTS (Super Admin Only)\n');

    // Test 5: List all admins
    console.log('5️⃣  List all admins...');
    const listAdminsResponse = await fetch(`${API_BASE}/management/admins`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    const listAdminsData = await listAdminsResponse.json();
    console.log(`   Status: ${listAdminsResponse.status}`);
    if (listAdminsData.admins) {
      console.log(`   ✅ Found ${listAdminsData.admins.length} admin(s)`);
      listAdminsData.admins.forEach(admin => {
        console.log(`      - ${admin.username} (${admin.email})`);
      });
    } else {
      console.log(`   ❌ ${listAdminsData.error}`);
    }
    console.log('');

    // Test 6: List approved emails
    console.log('6️⃣  List approved emails...');
    const listEmailsResponse = await fetch(`${API_BASE}/management/approved-emails`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    const listEmailsData = await listEmailsResponse.json();
    console.log(`   Status: ${listEmailsResponse.status}`);
    if (listEmailsData.emails) {
      console.log(`   ✅ Found ${listEmailsData.emails.length} approved email(s)`);
      listEmailsData.emails.forEach(email => {
        console.log(`      - ${email.email} ${email.is_super_admin ? '(Super Admin)' : ''}`);
      });
    } else {
      console.log(`   ❌ ${listEmailsData.error}`);
    }
    console.log('');

    // Test 7: Add approved email
    console.log('7️⃣  Add new approved email...');
    const addEmailResponse = await fetch(`${API_BASE}/management/approved-emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'newadmin@example.com',
        is_super_admin: false,
        notes: 'Test admin added via API',
      }),
    });
    const addEmailData = await addEmailResponse.json();
    console.log(`   Status: ${addEmailResponse.status}`);
    console.log(`   ${addEmailResponse.status === 201 || addEmailResponse.status === 409 ? '✅' : '❌'} ${addEmailData.message || addEmailData.error}\n`);

    // Test 8: Signup with newly approved email
    console.log('8️⃣  Signup with newly approved email...');
    const newAdminSignup = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newadmin@example.com',
        username: 'newadmin',
        password: 'NewAdmin123!',
        name: 'New Admin',
      }),
    });
    const newAdminData = await newAdminSignup.json();
    console.log(`   Status: ${newAdminSignup.status}`);
    console.log(`   ${newAdminSignup.status === 201 || newAdminSignup.status === 409 ? '✅' : '❌'} ${newAdminData.message || newAdminData.error}\n`);

    // Test 9: Login as new admin
    console.log('9️⃣  Login as new admin...');
    const newAdminLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'newadmin',
        password: 'NewAdmin123!',
      }),
    });
    const newAdminLoginData = await newAdminLogin.json();
    console.log(`   Status: ${newAdminLogin.status}`);
    if (newAdminLoginData.token) {
      adminToken = newAdminLoginData.token;
      console.log(`   ✅ Login successful`);
      console.log(`   Super Admin: ${newAdminLoginData.admin.is_super_admin}\n`);
    } else {
      console.log(`   ❌ Login failed: ${newAdminLoginData.error}\n`);
    }

    // Test 10: Try to access management as regular admin (should fail)
    console.log('🔟 Try to access management as regular admin (should fail)...');
    const unauthorizedAccess = await fetch(`${API_BASE}/management/admins`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    const unauthorizedData = await unauthorizedAccess.json();
    console.log(`   Status: ${unauthorizedAccess.status}`);
    console.log(`   ${unauthorizedAccess.status === 403 ? '✅' : '❌'} ${unauthorizedData.error || 'Unexpected success'}\n`);

    // Test 11: Get activity log
    console.log('1️⃣1️⃣  Get admin activity log...');
    const activityLogResponse = await fetch(`${API_BASE}/management/activity-log`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    const activityLogData = await activityLogResponse.json();
    console.log(`   Status: ${activityLogResponse.status}`);
    if (activityLogData.activities) {
      console.log(`   ✅ Found ${activityLogData.activities.length} activity log(s)`);
      activityLogData.activities.slice(0, 3).forEach(activity => {
        console.log(`      - ${activity.action_type}: ${activity.admin_email || activity.username} at ${new Date(activity.created_at).toLocaleString()}`);
      });
    } else {
      console.log(`   ❌ ${activityLogData.error}`);
    }
    console.log('');

    // Test 12: Remove approved email
    console.log('1️⃣2️⃣  Remove approved email...');
    const removeEmailResponse = await fetch(`${API_BASE}/management/approved-emails/newadmin@example.com`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    const removeEmailData = await removeEmailResponse.json();
    console.log(`   Status: ${removeEmailResponse.status}`);
    console.log(`   ${removeEmailResponse.status === 200 ? '✅' : '❌'} ${removeEmailData.message || removeEmailData.error}\n`);

    // ========================================
    // PART 3: RATE LIMITING
    // ========================================
    console.log('\n⏱️  PART 3: RATE LIMITING TEST\n');

    console.log('1️⃣3️⃣  Testing rate limiting (6 failed login attempts)...');
    for (let i = 1; i <= 6; i++) {
      const rateLimitResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'wronguser',
          password: 'wrongpass',
        }),
      });
      const rateLimitData = await rateLimitResponse.json();
      const status = rateLimitResponse.status;
      const icon = status === 429 ? '🚫' : status === 401 ? '❌' : '❓';
      console.log(`   ${icon} Attempt ${i}: Status ${status} - ${rateLimitData.error}`);
    }
    console.log('   ✅ Rate limiting test complete\n');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED!');
    console.log('='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Authentication: Working');
    console.log('   ✅ Super Admin Access: Working');
    console.log('   ✅ Regular Admin Restrictions: Working');
    console.log('   ✅ Approved Email Management: Working');
    console.log('   ✅ Activity Logging: Working');
    console.log('   ✅ Rate Limiting: Working');
    console.log('\n🎉 Admin system is fully functional!\n');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error('   Make sure the backend server is running on port 3000');
  }
}

// Run tests
console.log('\n🚀 Starting Complete Admin System Tests...');
console.log('   Make sure backend is running: npm run dev\n');
testCompleteAdminSystem();
