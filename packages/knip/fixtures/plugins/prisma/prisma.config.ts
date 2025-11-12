import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema-root-config.prisma',
  migrations: {
    seed: 'tsx prisma/seed-root-config.ts',
  },
});
