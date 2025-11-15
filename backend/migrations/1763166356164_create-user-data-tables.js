/**
 * User Data Tables Migration
 * Creates user_recipes, shopping_lists, user_points, and referrals tables
 */

exports.up = (pgm) => {
  // Create user_recipes table (favorites)
  pgm.createTable('user_recipes', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    recipe_id: {
      type: 'varchar(255)',
      notNull: true,
    },
    recipe_data: {
      type: 'jsonb',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.addConstraint('user_recipes', 'unique_user_recipe', {
    unique: ['user_id', 'recipe_id'],
  });
  pgm.createIndex('user_recipes', 'user_id');

  // Create shopping_lists table
  pgm.createTable('shopping_lists', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    ingredient_name: {
      type: 'varchar(255)',
      notNull: true,
    },
    quantity: {
      type: 'varchar(100)',
    },
    is_checked: {
      type: 'boolean',
      default: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('shopping_lists', 'user_id');

  // Create user_points table
  pgm.createTable('user_points', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    points: {
      type: 'integer',
      notNull: true,
    },
    action: {
      type: 'varchar(255)',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('user_points', 'user_id');

  // Create referrals table
  pgm.createTable('referrals', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    referrer_user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    referred_user_id: {
      type: 'integer',
      references: 'users',
      onDelete: 'SET NULL',
    },
    referral_code: {
      type: 'varchar(50)',
      notNull: true,
      unique: true,
    },
    converted: {
      type: 'boolean',
      default: false,
    },
    converted_at: {
      type: 'timestamp',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('referrals', 'referrer_user_id');
  pgm.createIndex('referrals', 'referral_code');
};

exports.down = (pgm) => {
  pgm.dropTable('referrals');
  pgm.dropTable('user_points');
  pgm.dropTable('shopping_lists');
  pgm.dropTable('user_recipes');
};
