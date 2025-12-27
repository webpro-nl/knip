import knex from 'knex';

const config = require('./knexfile');
const db = knex(config.development);

export default db;
