import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema4.prisma',
  migrations: {
    seed: 'tsx ../prisma/seed3.ts',
  },
});
