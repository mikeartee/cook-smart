#!/usr/bin/env node

/**
 * Deployment Readiness Verification Script
 * 
 * This script checks if the system is ready for production deployment
 * Run this before deploying to catch any configuration issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Cook Smart - Deployment Readiness Check\n');
console.log('='.repeat(60));

let allChecksPassed = true;
const warnings = [];
const errors = [];

// Check 1: Environment Variables
console.log('\n📋 Checking Environment Variables...');
const requiredEnvVars = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'JWT_SECRET',
  'DISCORD_WEBHOOK_URL'
];

const optionalEnvVars = [
  'STRIPE_WEBHOOK_SECRET',
  'DISCORD_ERROR_WEBHOOK_URL',
  'PORT',
  'NODE_ENV'
];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName} is set`);
  } else {
    console.log(`  ❌ ${varName} is MISSING`);
    errors.push(`Missing required environment variable: ${varName}`);
    allChecksPassed = false;
  }
});

optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName} is set`);
  } else {
    console.log(`  ⚠️  ${varName} is not set (optional but recommended)`);
    warnings.push(`Optional environment variable not set: ${varName}`);
  }
});

// Check 2: Stripe Keys Format
console.log('\n🔑 Validating Stripe Keys...');
if (process.env.STRIPE_SECRET_KEY) {
  if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.log('  ⚠️  Using TEST Stripe key (switch to LIVE for production)');
    warnings.push('Using Stripe TEST key - switch to LIVE key for production');
  } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    console.log('  ✅ Using LIVE Stripe key');
  } else {
    console.log('  ❌ Invalid Stripe secret key format');
    errors.push('Invalid Stripe secret key format');
    allChecksPassed = false;
  }
}

if (process.env.STRIPE_PUBLISHABLE_KEY) {
  if (process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')) {
    console.log('  ⚠️  Using TEST Stripe publishable key');
  } else if (process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_')) {
    console.log('  ✅ Using LIVE Stripe publishable key');
  } else {
    console.log('  ❌ Invalid Stripe publishable key format');
    errors.push('Invalid Stripe publishable key format');
    allChecksPassed = false;
  }
}

// Check 3: Required Files
console.log('\n📁 Checking Required Files...');
const requiredFiles = [
  'src/server.ts',
  'src/services/StripeService.ts',
  'src/services/SubscriptionPricingService.ts',
  'src/services/PhaseManagementService.ts',
  'src/controllers/SubscriptionPricingController.ts',
  'src/controllers/StripeWebhookController.ts',
  'src/models/SubscriptionPlan.ts',
  'migrations/001_create_subscriptions_complete.sql',
  'migrations/007_create_subscription_pricing.sql',
  'scripts/setup-stripe-products.js',
  'scripts/check-database-tables.js',
  'public/admin-phase-management.html'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} is MISSING`);
    errors.push(`Missing required file: ${file}`);
    allChecksPassed = false;
  }
});

// Check 4: Database Connection
console.log('\n🗄️  Testing Database Connection...');
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.log('  ❌ Database connection FAILED');
      console.log(`     Error: ${err.message}`);
      errors.push(`Database connection failed: ${err.message}`);
      allChecksPassed = false;
    } else {
      console.log('  ✅ Database connection successful');
      console.log(`     Server time: ${result.rows[0].now}`);
    }
    
    pool.end();
    printSummary();
  });
} else {
  console.log('  ⚠️  Skipping database test (DATABASE_URL not set)');
  printSummary();
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY\n');

  if (errors.length > 0) {
    console.log('❌ ERRORS:');
    errors.forEach(error => console.log(`   - ${error}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }

  if (allChecksPassed && errors.length === 0) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('\nYour system is ready for deployment.');
    console.log('\nNext steps:');
    console.log('1. Run database migrations: node run-all-migrations.js');
    console.log('2. Create Stripe products: node scripts/setup-stripe-products.js');
    console.log('3. Configure Stripe webhooks in dashboard');
    console.log('4. Deploy backend code');
    console.log('5. Test subscription flow');
    process.exit(0);
  } else {
    console.log('❌ DEPLOYMENT READINESS CHECK FAILED');
    console.log('\nPlease fix the errors above before deploying.');
    process.exit(1);
  }
}
