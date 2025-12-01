#!/bin/bash

# Get your auth token (you'll need to replace this with your actual token)
# You can get it from AsyncStorage in the app or from a login response

USER_ID="user_1763454524090_w2r1tkuyb"

# Send test notification via backend
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@api.cooksmartapp.com "cd /home/ubuntu/cook-smart/backend/backend && node -e \"
const service = require('./dist/services/PushNotificationService').PushNotificationService;
service.sendTestNotification('$USER_ID')
  .then(result => console.log('✅ Test notification sent:', result))
  .catch(err => console.error('❌ Error:', err));
\""

