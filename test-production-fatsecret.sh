#!/bin/bash

echo "Testing FatSecret API from production server..."
echo "Server: 34.203.8.150 (AWS EC2)"
echo ""

# Test if production server can access FatSecret
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 << 'EOF'
echo "Current server IP:"
curl -s https://api.ipify.org

echo -e "\n\nTesting FatSecret API access..."
cd /home/ubuntu/cook-smart/backend/backend

# Test with Node.js
node -e "
const axios = require('axios');

async function testFatSecret() {
  try {
    const auth = Buffer.from('e2cf80c43b0c4687ba237b45438c4ad4:3ce76986cd444c4084d093f70f3e36bf').toString('base64');
    
    const tokenResponse = await axios.post(
      'https://oauth.fatsecret.com/connect/token',
      'grant_type=client_credentials&scope=premier',
      {
        headers: {
          Authorization: \`Basic \${auth}\`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const token = tokenResponse.data.access_token;
    console.log('✅ Token obtained');
    
    const apiResponse = await axios.post(
      'https://platform.fatsecret.com/rest/server.api',
      null,
      {
        params: {
          method: 'recipes.search.v3',
          search_expression: 'chicken',
          max_results: 1,
          format: 'json',
        },
        headers: {
          Authorization: \`Bearer \${token}\`,
        },
      }
    );

    console.log('✅ API SUCCESS:', JSON.stringify(apiResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ API ERROR:', JSON.stringify(error.response?.data, null, 2));
  }
}

testFatSecret();
"
EOF