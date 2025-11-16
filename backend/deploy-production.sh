#!/bin/bash

# Cook Smart - Production Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Cook Smart - Production Deployment"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify readiness
echo "📋 Step 1: Verifying deployment readiness..."
node scripts/verify-deployment-readiness.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Readiness check failed. Please fix errors before deploying.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Readiness check passed${NC}"
echo ""

# Step 2: Run migrations
echo "🗄️  Step 2: Running database migrations..."
read -p "Run database migrations? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    node run-all-migrations.js
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrations completed${NC}"
    else
        echo -e "${RED}❌ Migrations failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipping migrations${NC}"
fi
echo ""

# Step 3: Create Stripe products
echo "💳 Step 3: Creating Stripe products..."
echo -e "${YELLOW}⚠️  Make sure you're in Stripe LIVE mode!${NC}"
read -p "Create Stripe products? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    node scripts/setup-stripe-products.js
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Stripe products created${NC}"
        echo -e "${YELLOW}⚠️  SAVE THE PRODUCT IDs FROM ABOVE!${NC}"
    else
        echo -e "${RED}❌ Stripe product creation failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipping Stripe product creation${NC}"
fi
echo ""

# Step 4: Verify database tables
echo "🔍 Step 4: Verifying database tables..."
node scripts/check-database-tables.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database tables verified${NC}"
else
    echo -e "${RED}❌ Database verification failed${NC}"
    exit 1
fi
echo ""

# Step 5: Build backend
echo "🔨 Step 5: Building backend..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend built successfully${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi
echo ""

# Step 6: Deployment summary
echo "======================================"
echo "📊 DEPLOYMENT SUMMARY"
echo "======================================"
echo ""
echo -e "${GREEN}✅ All automated steps completed successfully!${NC}"
echo ""
echo "Manual steps remaining:"
echo "1. Configure Stripe webhook in dashboard"
echo "   URL: https://your-api-domain.com/api/webhooks/stripe"
echo "   Events: subscription.*, invoice.*"
echo ""
echo "2. Deploy code to production server"
echo "   - Push Docker image, or"
echo "   - Deploy via your CI/CD pipeline"
echo ""
echo "3. Restart production server"
echo ""
echo "4. Verify deployment:"
echo "   curl https://your-api-domain.com/api/health"
echo "   curl https://your-api-domain.com/api/v1/subscriptions/phase"
echo ""
echo "5. Test subscription flow with test card"
echo ""
echo "6. Monitor logs and Discord notifications"
echo ""
echo -e "${GREEN}🎉 Ready for production deployment!${NC}"
