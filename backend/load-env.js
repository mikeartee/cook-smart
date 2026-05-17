// Environment loader for Cook Smart.
//
// Loads from .env.secure if available, otherwise .env, otherwise warns and
// continues so the process can still serve health checks while the developer
// fixes their environment. Per-feature errors (e.g. missing JWT_SECRET, missing
// FATSECRET_CLIENT_ID) are surfaced by the relevant routes/middleware at the
// point of use — see `docs/codebase-assessment.md` Section 4 for the
// minimum-viable env block.

const fs = require('fs');
const path = require('path');

function loadEnvironment() {
  const secureEnvPath = path.join(__dirname, '.env.secure');
  const defaultEnvPath = path.join(__dirname, '.env');

  // Try to load secure environment first
  if (fs.existsSync(secureEnvPath)) {
    console.log('🔒 Loading secure environment from .env.secure');
    require('dotenv').config({path: secureEnvPath});
    return;
  }

  if (fs.existsSync(defaultEnvPath)) {
    console.log('⚠️  Loading development environment from .env');
    console.log('   For production, copy .env.secure.example to .env.secure');
    require('dotenv').config({path: defaultEnvPath});
    return;
  }

  // Neither file exists. Don't exit — let the server start so the developer
  // can hit /health and see what they're missing. Each route surfaces clearer
  // errors when the env vars it needs are absent.
  console.warn(
    '⚠️  No environment file found at .env.secure or .env — continuing with whatever variables are already in process.env.',
  );
  console.warn(
    '   See backend/.env.example for the minimum-viable local set, or docs/codebase-assessment.md Section 4.',
  );
}

module.exports = {loadEnvironment};
