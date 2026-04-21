import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default {
  vite: {
    resolve: {
      alias: {
        '@/lib/database': path.resolve('./src/lib/database-local.ts'),
        '@/lib/auth': path.resolve(__dirname, 'src/lib/auth-local.ts'),
        '@/lib/mailer': fileURLToPath(new URL('./src/lib/mailer-local.ts', import.meta.url)),
      },
    },
  },
};
