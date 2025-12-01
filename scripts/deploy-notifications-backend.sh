#!/bin/bash

# Deploy Notification System to Backend
# This script updates the backend with Firebase Cloud Messaging support

set -e

echo "🚀 Deploying Notification System to Backend"
echo "============================================"

# Configuration
SERVER="ubuntu@api.cooksmartapp.com"
BACKEND_PATH="/home/ubuntu/cook-smart/backend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if firebase-admin is installed
echo ""
echo "📦 Step 1: Installing firebase-admin..."
ssh $SERVER "cd $BACKEND_PATH && npm install firebase-admin"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ firebase-admin installed${NC}"
else
    echo -e "${RED}❌ Failed to install firebase-admin${NC}"
    exit 1
fi

# Step 2: Upload new notification service
echo ""
echo "📤 Step 2: Uploading new notification service..."
scp backend/src/services/PushNotificationService.firebase.ts $SERVER:$BACKEND_PATH/src/services/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ File uploaded${NC}"
else
    echo -e "${RED}❌ Failed to upload file${NC}"
    exit 1
fi

# Step 3: Backup old service and replace
echo ""
echo "🔄 Step 3: Replacing notification service..."
ssh $SERVER "cd $BACKEND_PATH/src/services && \
    mv PushNotificationService.ts PushNotificationService.old.ts && \
    mv PushNotificationService.firebase.ts PushNotificationService.ts"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Service replaced${NC}"
else
    echo -e "${RED}❌ Failed to replace service${NC}"
    exit 1
fi

# Step 4: Check for Firebase service account
echo ""
echo "🔑 Step 4: Checking Firebase service account..."
ssh $SERVER "test -f $BACKEND_PATH/config/firebase-service-account.json"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Firebase service account found${NC}"
else
    echo -e "${YELLOW}⚠️  Firebase service account NOT found${NC}"
    echo ""
    echo "You need to:"
    echo "1. Download service account key from Firebase Console"
    echo "2. Upload it: scp firebase-service-account.json $SERVER:$BACKEND_PATH/config/"
    echo ""
    read -p "Press Enter when done, or Ctrl+C to exit..."
fi

# Step 5: Check environment variable
echo ""
echo "🔧 Step 5: Checking environment variable..."
ssh $SERVER "grep -q FIREBASE_SERVICE_ACCOUNT_PATH $BACKEND_PATH/.env"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Environment variable set${NC}"
else
    echo -e "${YELLOW}⚠️  Environment variable NOT set${NC}"
    echo ""
    echo "Adding FIREBASE_SERVICE_ACCOUNT_PATH to .env..."
    ssh $SERVER "echo 'FIREBASE_SERVICE_ACCOUNT_PATH=$BACKEND_PATH/config/firebase-service-account.json' >> $BACKEND_PATH/.env"
    echo -e "${GREEN}✅ Environment variable added${NC}"
fi

# Step 6: Rebuild backend
echo ""
echo "🔨 Step 6: Building backend..."
ssh $SERVER "cd $BACKEND_PATH && npm run build"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 7: Restart backend
echo ""
echo "🔄 Step 7: Restarting backend..."
ssh $SERVER "pm2 restart cook-smart-backend"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend restarted${NC}"
else
    echo -e "${RED}❌ Failed to restart backend${NC}"
    exit 1
fi

# Step 8: Check logs
echo ""
echo "📋 Step 8: Checking logs..."
sleep 3
ssh $SERVER "pm2 logs cook-smart-backend --lines 20 --nostream" | grep -i firebase

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "1. Build new APK with: cd android && gradlew assembleRelease"
echo "2. Install APK on device"
echo "3. Enable notifications in app"
echo "4. Check logs: ssh $SERVER 'pm2 logs cook-smart-backend'"
echo ""

