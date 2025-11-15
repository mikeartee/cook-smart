/**
 * Users Table Migration
 * Creates the main users table with authentication and subscription fields
 */

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    first_name: {
      type: 'varchar(100)',
    },
    last_name: {
      type: 'varchar(100)',
    },
    is_co_founder: {
      type: 'boolean',
      default: false,
    },
    subscription_status: {
      type: 'varchar(50)',
      default: 'free',
    },
    subscription_expires_at: {
      type: 'timestamp',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes for performance
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'is_co_founder', {
    where: 'is_co_founder = true',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
