exports.up = function(knex) {
  return knex.schema.createTable('ingredients', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('category').notNullable(); // proteins, vegetables, fruits, grains, dairy, spices, etc.
    table.text('description');
    table.json('common_names').defaultTo('[]'); // synonyms and alternate names
    table.string('barcode'); // for barcode scanning
    table.json('nutrition_per_100g'); // calories, protein, carbs, fat, etc.
    table.string('default_unit').defaultTo('piece'); // piece, cup, lb, oz, etc.
    table.boolean('is_common').defaultTo(true); // for filtering common vs rare ingredients
    table.timestamps(true, true);
    
    table.index(['category']);
    table.index(['name']);
    table.index(['barcode']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ingredients');
};