// Environment loader for Cook Smart
// Loads from .env.secure if available, otherwise falls back to .env

const fs = require('fs');
const path = require('path');

function loadEnvironment() {
  const secureEnvPath = path.join(__dirname, '.env.secure');
  const defaultEnvPath = path.join(__dirname, '.env');

  // Try to load secure environment first
  if (fs.existsSync(secureEnvPath)) {
    console.log('🔒 Loading secure environment from .env.secure');
    require('dotenv').config({path: secureEnvPath});
  } else if (fs.existsSync(defaultEnvPath)) {
    console.log('⚠️  Loading development environment from .env');
    console.log('   For production, copy .env.secure.example to .env.secure');
    require('dotenv').config({path: defaultEnvPath});
  } else {
    console.error('❌ No environment file found! Create .env.secure or .env');
    process.exit(1);
  }
}

module.exports = {loadEnvironment};
