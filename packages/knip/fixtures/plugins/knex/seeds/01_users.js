exports.seed = async knex => {
  await knex('users').del();
  await knex('users').insert([
    { id: 1, email: 'user1@example.com', name: 'User One' },
    { id: 2, email: 'user2@example.com', name: 'User Two' },
    { id: 3, email: 'user3@example.com', name: 'User Three' },
  ]);
};
