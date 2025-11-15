// Run migrations with environment variables loaded
require('dotenv').config({ path: '../.env' });
const { execSync } = require('child_process');

console.log('Loading environment variables...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Loaded' : '❌ Missing');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('\nRunning migrations...\n');

try {
  const output = execSync('npx node-pg-migrate up', {
    env: { ...process.env },
    stdio: 'inherit'
  });
  
  console.log('\n✅ Migrations completed successfully!');
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
