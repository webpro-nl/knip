export type MikroOrmDirectoryConfig = {
  path?: string;
  pathTs?: string;
  glob?: string;
};

export type MikroOrmOptions = {
  baseDir?: string;
  entities?: unknown;
  entitiesTs?: unknown;
  migrations?: MikroOrmDirectoryConfig & {
    migrationsList?: unknown;
  };
  seeder?: MikroOrmDirectoryConfig;
};

export type MikroOrmPackageJson = {
  'mikro-orm'?: {
    configPaths?: string | string[];
  };
};

export type MikroOrmConfig = MikroOrmOptions | MikroOrmOptions[] | MikroOrmPackageJson;
