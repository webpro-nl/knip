import 'dotenv/config';
import options from './config/database.ts';

export default {
  ...options,
  outFile: 'src/generated.ts',
  url: process.env.DATABASE_URL,
};
