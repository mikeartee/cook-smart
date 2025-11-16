exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.boolean('is_special_user').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('is_special_user');
  });
};
