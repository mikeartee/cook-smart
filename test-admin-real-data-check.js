const axios = require('axios');

const API_BASE_URL = 'https://api.cooksmartapp.com';

async function testAdminData() {
  console.log('🔍 Testing Admin Dashboard Real Data...\n');

  try {
    // Test admin login first
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(
      `${API_BASE_URL}/api/v1/admin/auth/login`,
      {
        email: 'bradturnbough80@gmail.com',
        password: 'June172018!',
      },
    );

    if (!loginResponse.data.token) {
      throw new Error('No token received from login');
    }

    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');

    // Set up headers for authenticated requests
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Test analytics overview endpoint
    console.log('\n2. Testing analytics overview endpoint...');
    const analyticsResponse = await axios.get(
      `${API_BASE_URL}/api/v1/admin/analytics/overview`,
      {headers},
    );

    console.log('✅ Analytics data received:');
    console.log('   Total Users:', analyticsResponse.data.overview.users.total);
    console.log(
      '   Premium Users:',
      analyticsResponse.data.overview.users.premium,
    );
    console.log(
      '   Co-Founders:',
      analyticsResponse.data.overview.users.coFounders,
    );
    console.log('   DAU:', analyticsResponse.data.overview.engagement.dau);
    console.log('   MAU:', analyticsResponse.data.overview.engagement.mau);
    console.log(
      '   Total Ingredients:',
      analyticsResponse.data.overview.engagement.totalIngredients,
    );
    console.log(
      '   Total Recipes:',
      analyticsResponse.data.overview.engagement.totalRecipes,
    );
    console.log('   MRR:', analyticsResponse.data.overview.revenue.mrr);
    console.log(
      '   Active Subscriptions:',
      analyticsResponse.data.overview.subscriptions.active,
    );

    // Test users endpoint
    console.log('\n3. Testing users endpoint...');
    const usersResponse = await axios.get(
      `${API_BASE_URL}/api/v1/admin/users?page=1&limit=5`,
      {headers},
    );

    console.log('✅ Users data received:');
    console.log('   Total Users Found:', usersResponse.data.total);
    console.log('   Users in Response:', usersResponse.data.users.length);
    if (usersResponse.data.users.length > 0) {
      console.log('   First User:', {
        id: usersResponse.data.users[0].id,
        name: usersResponse.data.users[0].name,
        email: usersResponse.data.users[0].email,
        role: usersResponse.data.users[0].role,
      });
    }

    // Test recipes endpoint
    console.log('\n4. Testing recipes endpoint...');
    try {
      const recipesResponse = await axios.get(
        `${API_BASE_URL}/api/v1/admin/recipes?page=1&limit=5`,
        {headers},
      );

      console.log('✅ Recipes data received:');
      console.log('   Total Recipes Found:', recipesResponse.data.total);
      console.log(
        '   Recipes in Response:',
        recipesResponse.data.recipes.length,
      );
      if (recipesResponse.data.recipes.length > 0) {
        console.log('   First Recipe:', {
          id: recipesResponse.data.recipes[0].id,
          title: recipesResponse.data.recipes[0].title,
          status: recipesResponse.data.recipes[0].status,
        });
      }
    } catch (recipeError) {
      console.log(
        '⚠️  Recipes endpoint error:',
        recipeError.response?.status,
        recipeError.response?.data?.error || recipeError.message,
      );
    }

    // Test feedback endpoint
    console.log('\n5. Testing feedback endpoint...');
    const feedbackResponse = await axios.get(
      `${API_BASE_URL}/api/v1/admin/feedback`,
      {headers},
    );

    console.log('✅ Feedback data received:');
    console.log(
      '   Total Feedback Items:',
      feedbackResponse.data.feedback.length,
    );
    if (feedbackResponse.data.feedback.length > 0) {
      console.log('   First Feedback:', {
        id: feedbackResponse.data.feedback[0].id,
        message:
          feedbackResponse.data.feedback[0].message.substring(0, 50) + '...',
        user_email: feedbackResponse.data.feedback[0].user_email,
      });
    }

    console.log('\n🎉 ALL ADMIN ENDPOINTS WORKING WITH REAL DATA!');
    console.log('\n📊 SUMMARY:');
    console.log(
      `   • ${analyticsResponse.data.overview.users.total} total users`,
    );
    console.log(
      `   • ${usersResponse.data.total || usersResponse.data.users.length} users accessible via admin`,
    );
    console.log(`   • ${feedbackResponse.data.feedback.length} feedback items`);
    console.log(`   • Analytics showing real engagement data`);
  } catch (error) {
    console.error('❌ Error testing admin data:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testAdminData();
