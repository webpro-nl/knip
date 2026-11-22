type MikroOrmDirectoryConfig = {
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
  configPaths?: string | string[];
};

export type MikroOrmConfigFactory = (
  contextName: string
) => MikroOrmOptions | MikroOrmOptions[] | Promise<MikroOrmOptions | MikroOrmOptions[]>;

export type MikroOrmConfigItem = MikroOrmOptions | MikroOrmConfigFactory;

export type MikroOrmConfig = MikroOrmConfigItem | MikroOrmConfigItem[] | MikroOrmPackageJson;
