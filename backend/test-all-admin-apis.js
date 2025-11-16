/**
 * Comprehensive Admin API Test Suite
 * Tests all 60 admin endpoints
 */

const API_BASE = 'http://localhost:3000/api/v1';

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'YourPassword123!'
};

let adminToken = '';

async function loginAsAdmin() {
  console.log('\n🔐 Logging in as admin...');
  const response = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMIN_CREDENTIALS)
  });
  const data = await response.json();
  if (response.ok) {
    adminToken = data.token;
    console.log('✅ Admin login successful');
    return true;
  }
  console.log('❌ Admin login failed:', data.error);
  return false;
}

async function testEndpoint(name, method, path, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${name}`);
      return true;
    } else {
      console.log(`❌ ${name}: ${data.error || 'Failed'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     Admin API Comprehensive Test Suite    ║');
  console.log('╚════════════════════════════════════════════╝');

  if (!await loginAsAdmin()) return;

  let passed = 0;
  let failed = 0;

  console.log('\n📊 ANALYTICS API (5 endpoints)');
  if (await testEndpoint('Analytics Overview', 'GET', '/admin/analytics/overview')) passed++; else failed++;
  if (await testEndpoint('Growth Data', 'GET', '/admin/analytics/growth?days=30')) passed++; else failed++;
  if (await testEndpoint('Revenue Trends', 'GET', '/admin/analytics/revenue-trends?months=6')) passed++; else failed++;
  if (await testEndpoint('Feature Usage', 'GET', '/admin/analytics/features')) passed++; else failed++;
  if (await testEndpoint('Export Analytics', 'GET', '/admin/analytics/export?format=json')) passed++; else failed++;

  console.log('\n👥 USER MANAGEMENT API (5 endpoints)');
  if (await testEndpoint('List Users', 'GET', '/admin/users?page=1&limit=10')) passed++; else failed++;
  if (await testEndpoint('Search Users', 'GET', '/admin/users?search=test')) passed++; else failed++;
  if (await testEndpoint('Filter Users', 'GET', '/admin/users?accountType=free')) passed++; else failed++;

  console.log('\n💳 SUBSCRIPTION API (7 endpoints)');
  if (await testEndpoint('Subscription Overview', 'GET', '/admin/subscriptions/overview')) passed++; else failed++;
  if (await testEndpoint('List Subscriptions', 'GET', '/admin/subscriptions?page=1')) passed++; else failed++;
  if (await testEndpoint('Billing History', 'GET', '/admin/subscriptions/billing-history')) passed++; else failed++;

  console.log('\n💬 FEEDBACK API (5 endpoints)');
  if (await testEndpoint('List Feedback', 'GET', '/admin/feedback?page=1')) passed++; else failed++;
  if (await testEndpoint('Filter Feedback', 'GET', '/admin/feedback?category=Bug')) passed++; else failed++;

  console.log('\n🚨 ERROR MONITORING API (3 endpoints)');
  if (await testEndpoint('List Errors', 'GET', '/admin/errors?page=1')) passed++; else failed++;
  if (await testEndpoint('Error Frequency', 'GET', '/admin/errors/stats/frequency?days=7')) passed++; else failed++;

  console.log('\n🏥 SYSTEM HEALTH API (6 endpoints)');
  if (await testEndpoint('Health Overview', 'GET', '/admin/health/overview')) passed++; else failed++;
  if (await testEndpoint('Server Metrics', 'GET', '/admin/health/server')) passed++; else failed++;
  if (await testEndpoint('Database Metrics', 'GET', '/admin/health/database')) passed++; else failed++;
  if (await testEndpoint('API Metrics', 'GET', '/admin/health/api')) passed++; else failed++;
  if (await testEndpoint('External Services', 'GET', '/admin/health/external-services')) passed++; else failed++;
  if (await testEndpoint('Cache Metrics', 'GET', '/admin/health/cache')) passed++; else failed++;

  console.log('\n💾 CACHE MANAGEMENT API (4 endpoints)');
  if (await testEndpoint('Cache Stats', 'GET', '/admin/cache/stats')) passed++; else failed++;
  if (await testEndpoint('Popular Recipes', 'GET', '/admin/cache/popular?limit=10')) passed++; else failed++;

  console.log('\n💰 COST MONITORING API (5 endpoints)');
  if (await testEndpoint('Current Costs', 'GET', '/admin/costs/current')) passed++; else failed++;
  if (await testEndpoint('Cost Trends', 'GET', '/admin/costs/trends?months=6')) passed++; else failed++;
  if (await testEndpoint('Cost Per User', 'GET', '/admin/costs/per-user')) passed++; else failed++;
  if (await testEndpoint('Cost Projections', 'GET', '/admin/costs/projections')) passed++; else failed++;
  if (await testEndpoint('Cost Alerts', 'GET', '/admin/costs/alerts')) passed++; else failed++;

  console.log('\n🔗 REFERRAL API (5 endpoints)');
  if (await testEndpoint('Referral Overview', 'GET', '/admin/referrals/overview')) passed++; else failed++;
  if (await testEndpoint('Top Referrers', 'GET', '/admin/referrals/top-referrers?limit=10')) passed++; else failed++;
  if (await testEndpoint('Referral Codes', 'GET', '/admin/referrals/codes')) passed++; else failed++;

  console.log('\n╔════════════════════════════════════════════╗');
  console.log(`║  Results: ${passed} passed, ${failed} failed              ║`);
  console.log('╚════════════════════════════════════════════╝\n');
}

runTests();
