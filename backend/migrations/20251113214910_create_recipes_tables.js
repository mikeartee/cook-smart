exports.up = function(knex) {
  return knex.schema
    .createTable('recipes', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title').notNullable();
      table.text('description');
      table.text('instructions');
      table.integer('prep_time_minutes');
      table.integer('cook_time_minutes');
      table.integer('total_time_minutes');
      table.integer('servings').defaultTo(4);
      table.string('difficulty').defaultTo('medium'); // easy, medium, hard
      table.string('cuisine_type');
      table.json('dietary_tags').defaultTo('[]'); // vegetarian, vegan, gluten-free, etc.
      table.string('image_url');
      table.string('source_api'); // spoonacular, edamam, themealdb, user
      table.string('external_id'); // API recipe ID
      table.json('nutrition_per_serving');
      table.boolean('is_user_submitted').defaultTo(false);
      table.boolean('is_lolz_recipe').defaultTo(false);
      table.string('moderation_status').defaultTo('approved'); // pending, approved, rejected
      table.timestamps(true, true);
      
      table.index(['difficulty']);
      table.index(['total_time_minutes']);
      table.index(['servings']);
      table.index(['source_api']);
      table.index(['moderation_status']);
    })
    .createTable('user_recipes', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('recipe_id').references('id').inTable('recipes').onDelete('CASCADE');
      table.boolean('is_favorite').defaultTo(false);
      table.integer('rating'); // 1-5 stars
      table.text('notes');
      table.json('custom_substitutions');
      table.timestamp('last_cooked_at');
      table.timestamps(true, true);
      
      table.unique(['user_id', 'recipe_id']);
      table.index(['user_id']);
      table.index(['is_favorite']);
    })
    .createTable('shopping_lists', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('name').defaultTo('My Shopping List');
      table.json('items'); // [{ingredient_id, quantity, unit, checked}]
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['is_active']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('shopping_lists')
    .dropTable('user_recipes')
    .dropTable('recipes');
};