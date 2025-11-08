export type PrismaConfig = {
  // package.json
  seed?: string;

  // Prisma config file
  migrations?: {
    seed?: string;
  };

  // both
  schema?: string;
};
