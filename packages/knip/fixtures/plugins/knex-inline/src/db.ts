import knex from 'knex';
import { knex as createClient } from 'knex';
const knexCjs = require('knex');
const { knex: createCjsClient } = require('knex');

export const pgDb = knex({ client: 'pg', connection: process.env.DATABASE_URL });

export const mysqlDb = createClient({ client: 'mysql2', connection: {} });

export const sqliteDb = knexCjs({ client: 'better-sqlite3', connection: {} });

export const mssqlDb = createCjsClient({ client: 'mssql', connection: {} });
