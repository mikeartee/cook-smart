// Simple recipe test
async function test() {
  try {
    // First register
    const registerRes = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@test.com`,
        password: 'Test123!Test',
        first_name: 'Test',
        last_name: 'User',
        age_verified: true
      })
    });
    
    const registerData = await registerRes.json();
    console.log('Register:', registerData.token ? 'SUCCESS' : 'FAILED');
    
    if (!registerData.token) {
      console.log('Error:', registerData);
      return;
    }
    
    const token = registerData.token;
    
    // Wait for backend to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test recipe search
    console.log('\nTesting recipe search...');
    const url = 'http://localhost:3000/api/v1/recipes/search?ingredients=chicken,rice';
    console.log('URL:', url);
    console.log('Token:', token.substring(0, 20) + '...');
    
    const recipeRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', recipeRes.status);
    console.log('Status Text:', recipeRes.statusText);
    
    const recipeData = await recipeRes.json();
    console.log('\nResponse:', JSON.stringify(recipeData, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
