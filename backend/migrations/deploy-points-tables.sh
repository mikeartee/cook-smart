#!/bin/bash
# Deploy points tables to production database
# Run this on your EC2 server

echo "🔄 Deploying points tables to production database..."

# Load environment variables
export $(cat /home/ubuntu/cook-smart/backend/.env | grep -v '^#' | xargs)

# Run the migration using Node.js
cd /home/ubuntu/cook-smart/backend
node migrations/run-create-points-tables.js

echo "✅ Points tables deployment complete!"
