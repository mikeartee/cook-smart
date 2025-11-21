const {Pool} = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {rejectUnauthorized: false},
});

async function checkAndCreateAdmin() {
  try {
    console.log('🔍 Checking admin users...\n');

    // Check if admin_users table exists and has data
    const result = await pool.query('SELECT * FROM admin_users');

    console.log(`📊 Found ${result.rows.length} admin users`);

    if (result.rows.length > 0) {
      console.log('\nExisting admins:');
      result.rows.forEach(admin => {
        console.log(
          `  - ${admin.email} (${admin.username}) - Super Admin: ${admin.is_super_admin}`,
        );
      });
    } else {
      console.log('\n⚠️  No admin users found. Creating default admin...');

      // Create default admin
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await pool.query(
        `
        INSERT INTO admin_users (username, email, password_hash, is_super_admin, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `,
        ['admin', 'admin@cooksmartapp.com', hashedPassword, true],
      );

      console.log('✅ Default admin created:');
      console.log('   Email: admin@cooksmartapp.com');
      console.log('   Password: admin123');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndCreateAdmin();
