require('dotenv/config');

module.exports = {
  dialect: 'postgres',
  url: process.env.DATABASE_URL,
};
