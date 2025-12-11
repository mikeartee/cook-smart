const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.NODE_ENV === 'production' ? {rejectUnauthorized: false} : false,
});

async function checkAdminSetup() {
  try {
    console.log('Checking admin setup...\n');

    // Check if admin tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('admin_users', 'approved_admin_emails')
    `;
    const tablesResult = await pool.query(tablesQuery);
    console.log(
      'Admin tables found:',
      tablesResult.rows.map(r => r.table_name),
    );

    if (tablesResult.rows.length === 0) {
      console.log(
        '\n❌ No admin tables found. You need to run migrations first.',
      );
      return;
    }

    // Check approved emails
    const approvedEmailsQuery = 'SELECT * FROM approved_admin_emails';
    const approvedResult = await pool.query(approvedEmailsQuery);
    console.log('\nApproved admin emails:', approvedResult.rows);

    // Check existing admin users
    const adminUsersQuery =
      'SELECT id, email, username, name, email_verified, created_at FROM admin_users';
    const adminResult = await pool.query(adminUsersQuery);
    console.log('\nExisting admin users:', adminResult.rows);

    // Check if your email is approved
    const yourEmail = 'bradturnbough80@gmail.com';
    const yourEmailQuery =
      'SELECT * FROM approved_admin_emails WHERE email = $1';
    const yourEmailResult = await pool.query(yourEmailQuery, [yourEmail]);

    if (yourEmailResult.rows.length > 0) {
      console.log(
        `\n✅ Your email (${yourEmail}) is approved for admin access`,
      );
    } else {
      console.log(
        `\n❌ Your email (${yourEmail}) is NOT approved for admin access`,
      );
      console.log(
        'You need to add it to the approved_admin_emails table first.',
      );
    }
  } catch (error) {
    console.error('Error checking admin setup:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdminSetup();
