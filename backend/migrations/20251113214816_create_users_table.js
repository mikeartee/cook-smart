exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name');
    table.string('last_name');
    table.boolean('is_co_founder').defaultTo(false);
    table.boolean('has_lifetime_subscription').defaultTo(false);
    table.string('subscription_status').defaultTo('free'); // free, trial, active, expired
    table.timestamp('subscription_expires_at');
    table.integer('points').defaultTo(0);
    table.boolean('age_verified').defaultTo(false);
    table.json('dietary_restrictions').defaultTo('[]');
    table.json('allergies').defaultTo('[]');
    table.boolean('show_nutrition').defaultTo(true);
    table.string('preferred_units').defaultTo('imperial'); // imperial, metric
    table.timestamps(true, true);
    table.timestamp('last_login_at');
    table.boolean('email_verified').defaultTo(false);
    table.string('email_verification_token');
    table.string('password_reset_token');
    table.timestamp('password_reset_expires');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};