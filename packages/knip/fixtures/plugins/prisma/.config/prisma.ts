import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema-dot-config.prisma',
  migrations: {
    seed: 'tsx ../prisma/seed-dot-config.ts',
  },
});
