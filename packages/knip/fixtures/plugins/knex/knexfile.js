module.exports = {
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    database: 'my_db',
    user: 'username',
    password: 'password',
  },
  migrations: {
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
};
