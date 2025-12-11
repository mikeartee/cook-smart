const axios = require('axios');

const API_BASE_URL = 'https://api.cooksmartapp.com';

async function runMigration() {
  console.log('🔧 Running Database Migration...\n');

  try {
    // Admin login
    const loginResponse = await axios.post(
      `${API_BASE_URL}/api/v1/admin/auth/login`,
      {
        email: 'bradturnbough80@gmail.com',
        password: 'June172018!',
      },
    );

    const token = loginResponse.data.token;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Check migration status first
    console.log('1. Checking current migration status...');
    const statusResponse = await axios.get(
      `${API_BASE_URL}/api/v1/admin/migration/status`,
      {headers},
    );

    console.log('✅ Migration Status:');
    console.log(
      `   Tables existing: ${statusResponse.data.tablesExisting}/${statusResponse.data.tablesRequired}`,
    );
    console.log(
      `   Migration complete: ${statusResponse.data.migrationComplete}`,
    );

    if (!statusResponse.data.migrationComplete) {
      console.log('\n2. Running migration...');
      const migrationResponse = await axios.post(
        `${API_BASE_URL}/api/v1/admin/migration/run`,
        {},
        {headers},
      );
      console.log('✅ Migration completed:', migrationResponse.data.message);

      // Check status again
      console.log('\n3. Verifying migration...');
      const newStatusResponse = await axios.get(
        `${API_BASE_URL}/api/v1/admin/migration/status`,
        {headers},
      );
      console.log(
        `✅ Final status: ${newStatusResponse.data.tablesExisting}/${newStatusResponse.data.tablesRequired} tables created`,
      );
    } else {
      console.log('✅ Migration already complete - all tables exist');
    }

    console.log('\n🎉 Database is ready for real data!');
    console.log(
      'All admin dashboard tables are now created and ready to receive data from user activity.',
    );
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

runMigration();
