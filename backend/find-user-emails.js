const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {rejectUnauthorized: false},
});

async function findEmails() {
  try {
    console.log('🔍 Searching for user accounts...\n');

    // Search for users with names containing toota or briana
    const result = await pool.query(`
      SELECT id, email, first_name, last_name, created_at 
      FROM users 
      WHERE LOWER(email) LIKE '%toota%' 
         OR LOWER(email) LIKE '%briana%'
         OR LOWER(first_name) LIKE '%toota%'
         OR LOWER(first_name) LIKE '%briana%'
      ORDER BY created_at DESC
    `);

    if (result.rows.length > 0) {
      console.log('Found users:');
      result.rows.forEach(user => {
        console.log(`  - ${user.first_name || ''} ${user.last_name || ''}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    ID: ${user.id}`);
        console.log('');
      });
    } else {
      console.log('No users found matching "toota" or "briana"');
      console.log('\nShowing all users:');
      const allUsers = await pool.query(
        'SELECT id, email, first_name, last_name FROM users ORDER BY created_at DESC LIMIT 10',
      );
      allUsers.rows.forEach(user => {
        console.log(
          `  - ${user.first_name || ''} ${user.last_name || ''} (${user.email})`,
        );
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findEmails();
