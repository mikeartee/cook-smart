/**
 * User Ingredients Tables Migration
 * Creates user_ingredients and custom_ingredients tables
 */

exports.up = (pgm) => {
  // Create user_ingredients table (user's inventory)
  pgm.createTable('user_ingredients', {
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
    ingredient_id: {
      type: 'integer',
      notNull: true,
      references: 'ingredients',
      onDelete: 'CASCADE',
    },
    quantity: {
      type: 'varchar(100)',
    },
    expiration_date: {
      type: 'date',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Unique constraint: user can't have duplicate ingredients
  pgm.addConstraint('user_ingredients', 'unique_user_ingredient', {
    unique: ['user_id', 'ingredient_id'],
  });

  // Create index for user lookups
  pgm.createIndex('user_ingredients', 'user_id');

  // Create custom_ingredients table (user-created ingredients)
  pgm.createTable('custom_ingredients', {
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
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    category: {
      type: 'varchar(100)',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create index for user lookups
  pgm.createIndex('custom_ingredients', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropTable('custom_ingredients');
  pgm.dropTable('user_ingredients');
};
