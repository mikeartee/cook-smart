/**
 * Ingredients Tables Migration
 * Creates ingredients and ingredient_synonyms tables
 */

exports.up = (pgm) => {
  // Create ingredients table
  pgm.createTable('ingredients', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    category: {
      type: 'varchar(100)',
      notNull: true,
    },
    is_common: {
      type: 'boolean',
      default: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes for ingredients
  pgm.createIndex('ingredients', 'category');
  pgm.createIndex('ingredients', 'name');

  // Create ingredient_synonyms table
  pgm.createTable('ingredient_synonyms', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    ingredient_id: {
      type: 'integer',
      notNull: true,
      references: 'ingredients',
      onDelete: 'CASCADE',
    },
    synonym: {
      type: 'varchar(255)',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create index for synonyms
  pgm.createIndex('ingredient_synonyms', 'ingredient_id');
};

exports.down = (pgm) => {
  pgm.dropTable('ingredient_synonyms');
  pgm.dropTable('ingredients');
};
