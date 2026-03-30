exports.up = knex =>
  knex.schema.createTable('users', table => {
    table.increments('id');
    table.string('email').notNullable().unique();
    table.string('name');
    table.timestamps(true, true);
  });

exports.down = knex => knex.schema.dropTableIfExists('users');
