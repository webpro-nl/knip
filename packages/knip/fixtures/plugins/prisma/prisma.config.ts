import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema3.prisma',
  migrations: {
    seed: 'tsx prisma/seed2.ts',
  },
});
