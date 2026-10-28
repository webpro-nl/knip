import { config } from 'dotenv';

config({ path: '.env.local' });

export default {
  dialect: 'postgres',
  url: process.env.DATABASE_URL,
};
