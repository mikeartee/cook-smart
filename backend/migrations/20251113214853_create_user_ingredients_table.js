exports.up = function(knex) {
  return knex.schema.createTable('user_ingredients', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('ingredient_id').references('id').inTable('ingredients').onDelete('CASCADE');
    table.decimal('quantity', 10, 2);
    table.string('unit').defaultTo('piece');
    table.date('expiration_date');
    table.text('notes');
    table.timestamps(true, true);
    
    table.unique(['user_id', 'ingredient_id']);
    table.index(['user_id']);
    table.index(['expiration_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_ingredients');
};