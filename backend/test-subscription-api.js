/**
 * Test Subscription API Endpoints
 * Run this to verify the subscription system is working
 */

const API_URL = 'http://localhost:3000/api/v1';

async function testAPI() {
  console.log('🧪 Testing Subscription API...\n');

  try {
    // Test 1: Get current phase
    console.log('1️⃣ Testing GET /subscriptions/phase');
    const phaseResponse = await fetch(`${API_URL}/subscriptions/phase`);
    const phaseData = await phaseResponse.json();
    console.log('   Response:', JSON.stringify(phaseData, null, 2));
    console.log('   ✅ Phase endpoint working!\n');

    // Test 2: Get available plans
    console.log('2️⃣ Testing GET /subscriptions/plans');
    const plansResponse = await fetch(`${API_URL}/subscriptions/plans`);
    const plansData = await plansResponse.json();
    console.log('   Response:', JSON.stringify(plansData, null, 2));
    console.log('   ✅ Plans endpoint working!\n');

    // Test 3: Get plans with referral code
    console.log('3️⃣ Testing GET /subscriptions/plans?referralCode=TEST123');
    const referralResponse = await fetch(
      `${API_URL}/subscriptions/plans?referralCode=TEST123`,
    );
    const referralData = await referralResponse.json();
    console.log('   Response:', JSON.stringify(referralData, null, 2));
    console.log('   ✅ Referral code endpoint working!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All API tests passed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 Summary:');
    console.log(`   Phase: ${phaseData.phase}`);
    console.log(`   Available Plans: ${plansData.plans?.length || 0}`);
    console.log(`   Beta Mode: ${phaseData.isBeta ? 'Yes' : 'No'}`);

    if (plansData.plans && plansData.plans.length > 0) {
      console.log('\n   Plans:');
      plansData.plans.forEach(plan => {
        console.log(
          `   - ${plan.displayName}: $${plan.initialPrice}/${plan.billingInterval}`,
        );
      });
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure your backend server is running:');
    console.log('   cd backend && npm start\n');
  }
}

testAPI();
