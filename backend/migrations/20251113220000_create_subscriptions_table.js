exports.up = function(knex) {
  return knex.schema.createTable('subscriptions', function(table) {
    table.string('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('plan_id').notNullable();
    table.enum('status', ['active', 'canceled', 'past_due', 'incomplete']).defaultTo('active');
    table.timestamp('current_period_start').notNullable();
    table.timestamp('current_period_end').notNullable();
    table.boolean('cancel_at_period_end').defaultTo(false);
    table.timestamps(true, true);
    
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.index(['user_id']);
    table.index(['status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('subscriptions');
};