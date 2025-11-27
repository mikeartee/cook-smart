#!/bin/bash
set -e

echo "🧹 Starting server cleanup..."

# Stop PM2
echo "1. Stopping PM2..."
pm2 stop cook-smart-backend || true
pm2 delete cook-smart-backend || true

# Clean up old directories
echo "2. Cleaning up old directories..."
cd /home/ubuntu
rm -rf cook-smart-backend/
mkdir -p old-files
mv *.sql *.json old-files/ 2>/dev/null || true

# Clone fresh from git
echo "3. Cloning from GitHub..."
git clone -b fresh-project-migration https://github.com/tootallgames2020/cook-smart.git 2>&1 || git clone https://github.com/tootallgames2020/cook-smart.git && cd cook-smart && git checkout fresh-project-migration

# Setup backend
echo "4. Setting up backend..."
cd cook-smart/backend

# Install dependencies
echo "5. Installing dependencies..."
npm install --legacy-peer-deps

# Build
echo "6. Building..."
npm run build

# Start with PM2
echo "7. Starting with PM2..."
pm2 start dist/server.js --name cook-smart-backend --cwd /home/ubuntu/cook-smart/backend
pm2 save

echo "✅ Server cleanup complete!"
echo ""
echo "⚠️  IMPORTANT: You need to create /home/ubuntu/cook-smart/backend/.env"
echo "Copy contents from your local secrets/.env.production file"
