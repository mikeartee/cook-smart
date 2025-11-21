const {Pool} = require('pg');

const pool = new Pool({
  host:
    process.env.DB_HOST ||
    'cook-smart-db.c3ql4eqUnits.us-east-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cook_smart_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'CookSmart2024!',
  ssl: {rejectUnauthorized: false},
});

async function checkAccount() {
  try {
    const result = await pool.query(
      'SELECT id, email, is_co_founder, is_special_user, is_creator, has_lifetime_subscription FROM users WHERE email = $1',
      ['bradturnbough80@gmail.com'],
    );

    console.log('Brad Account Status:');
    console.log(JSON.stringify(result.rows[0], null, 2));

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkAccount();
