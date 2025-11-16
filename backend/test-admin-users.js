/**
 * Test script for Admin User Management API
 * Tests all user management endpoints
 */

const API_BASE = 'http://localhost:3000/api/v1';

// Test credentials (update with actual admin credentials)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'YourPassword123!'
};

let adminToken = '';
let testUserId = '';

/**
 * Login as admin
 */
async function loginAsAdmin() {
  console.log('\n🔐 Logging in as admin...');
  
  try {
    const response = await fetch(`${API_BASE}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    const data = await response.json();

    if (response.ok) {
      adminToken = data.token;
      console.log('✅ Admin login successful');
      console.log(`   Token: ${adminToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Admin login failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin login error:', error.message);
    return false;
  }
}

/**
 * Test: List users with pagination
 */
async function testListUsers() {
  console.log('\n📋 Testing: List users...');
  
  try {
    const response = await fetch(`${API_BASE}/admin/users?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ List users successful');
      console.log(`   Total users: ${data.pagination.total}`);
      console.log(`   Users on page: ${data.users.length}`);
      
      if (data.users.length > 0) {
        testUserId = data.users[0].id;
        console.log(`   First user: ${data.users[0].email}`);
      }
    } else {
      console.log('❌ List users failed:', data.error);
    }
  } catch (error) {
    console.log('❌ List users error:', error.message);
  }
}

/**
 * Test: Search users
 */
async function testSearchUsers() {
  console.log('\n🔍 Testing: Search users...');
  
  try {
    const response = await fetch(`${API_BASE}/admin/users?search=gmail`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Search users successful');
      console.log(`   Found: ${data.users.length} users`);
    } else {
      console.log('❌ Search users failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Search users error:', error.message);
  }
}

/**
 * Test: Filter users by account type
 */
async function testFilterUsers() {
  console.log('\n🎯 Testing: Filter users by account type...');
  
  try {
    const response = await fetch(`${API_BASE}/admin/users?accountType=free`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Filter users successful');
      console.log(`   Free users: ${data.users.length}`);
    } else {
      console.log('❌ Filter users failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Filter users error:', error.message);
  }
}

/**
 * Test: Get user details
 */
async function testGetUserDetails() {
  if (!testUserId) {
    console.log('\n⚠️  Skipping user details test (no user ID)');
    return;
  }

  console.log('\n👤 Testing: Get user details...');
  
  try {
    const response = await fetch(`${API_BASE}/admin/users/${testUserId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Get user details successful');
      console.log(`   User: ${data.user.email}`);
      console.log(`   Ingredients: ${data.stats.ingredient_count}`);
      console.log(`   Recipes: ${data.stats.recipe_count}`);
      console.log(`   Feedback: ${data.stats.feedback_count}`);
    } else {
      console.log('❌ Get user details failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Get user details error:', error.message);
  }
}

/**
 * Test: Mark user as co-founder
 */
async function testMarkCoFounder() {
  if (!testUserId) {
    console.log('\n⚠️  Skipping co-founder test (no user ID)');
    return;
  }

  console.log('\n⭐ Testing: Mark user as co-founder...');
  
  try {
    // Mark as co-founder
    const response1 = await fetch(`${API_BASE}/admin/users/${testUserId}/co-founder`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isCoFounder: true })
    });

    const data1 = await response1.json();

    if (response1.ok) {
      console.log('✅ Mark as co-founder successful');
      console.log(`   User: ${data1.user.email}`);
      console.log(`   Is co-founder: ${data1.user.is_co_founder}`);
    } else {
      console.log('❌ Mark as co-founder failed:', data1.error);
      return;
    }

    // Unmark as co-founder
    const response2 = await fetch(`${API_BASE}/admin/users/${testUserId}/co-founder`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isCoFounder: false })
    });

    const data2 = await response2.json();

    if (response2.ok) {
      console.log('✅ Unmark as co-founder successful');
      console.log(`   Is co-founder: ${data2.user.is_co_founder}`);
    } else {
      console.log('❌ Unmark as co-founder failed:', data2.error);
    }
  } catch (error) {
    console.log('❌ Co-founder test error:', error.message);
  }
}

/**
 * Test: Suspend user
 */
async function testSuspendUser() {
  if (!testUserId) {
    console.log('\n⚠️  Skipping suspend test (no user ID)');
    return;
  }

  console.log('\n🚫 Testing: Suspend user...');
  
  try {
    // Suspend user
    const response1 = await fetch(`${API_BASE}/admin/users/${testUserId}/suspend`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        suspend: true, 
        reason: 'Test suspension' 
      })
    });

    const data1 = await response1.json();

    if (response1.ok) {
      console.log('✅ Suspend user successful');
      console.log(`   User: ${data1.user.email}`);
      console.log(`   Suspended: ${data1.user.is_suspended}`);
      console.log(`   Reason: ${data1.user.suspension_reason}`);
    } else {
      console.log('❌ Suspend user failed:', data1.error);
      return;
    }

    // Unsuspend user
    const response2 = await fetch(`${API_BASE}/admin/users/${testUserId}/suspend`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ suspend: false })
    });

    const data2 = await response2.json();

    if (response2.ok) {
      console.log('✅ Unsuspend user successful');
      console.log(`   Suspended: ${data2.user.is_suspended}`);
    } else {
      console.log('❌ Unsuspend user failed:', data2.error);
    }
  } catch (error) {
    console.log('❌ Suspend test error:', error.message);
  }
}

/**
 * Test: Delete user (without confirmation)
 */
async function testDeleteUserWithoutConfirmation() {
  if (!testUserId) {
    console.log('\n⚠️  Skipping delete test (no user ID)');
    return;
  }

  console.log('\n🗑️  Testing: Delete user without confirmation...');
  
  try {
    const response = await fetch(`${API_BASE}/admin/users/${testUserId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await response.json();

    if (response.status === 400) {
      console.log('✅ Delete protection working (confirmation required)');
      console.log(`   Error: ${data.error}`);
    } else {
      console.log('❌ Delete protection failed (should require confirmation)');
    }
  } catch (error) {
    console.log('❌ Delete test error:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Admin User Management API Test Suite    ║');
  console.log('╚════════════════════════════════════════════╝');

  // Login first
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin login');
    return;
  }

  // Run tests
  await testListUsers();
  await testSearchUsers();
  await testFilterUsers();
  await testGetUserDetails();
  await testMarkCoFounder();
  await testSuspendUser();
  await testDeleteUserWithoutConfirmation();

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║           Test Suite Complete              ║');
  console.log('╚════════════════════════════════════════════╝\n');
}

// Run tests
runTests();
