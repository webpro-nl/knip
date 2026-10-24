import 'dotenv/config';

export default {
  dialect: 'postgres',
  camelCase: true,
  url: process.env.DATABASE_URL,
};
