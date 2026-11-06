import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toConfig, toProductionEntry } from '../../util/input.ts';
import { join, toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { MikroOrmConfig, MikroOrmOptions, MikroOrmPackageJson } from './types.ts';

// https://mikro-orm.io/docs/quick-start
// https://mikro-orm.io/docs/configuration
// https://mikro-orm.io/docs/migrations
// https://mikro-orm.io/docs/seeding

const title = 'MikroORM';

const enablers = [/^@mikro-orm\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  'src/mikro-orm.config.{ts,js}',
  'mikro-orm.config.{ts,js}',
  'dist/mikro-orm.config.js',
  'build/mikro-orm.config.js',
  'package.json',
];

const DEFAULT_MIGRATIONS_GLOB = '!(*.d).{js,ts,cjs}';
const DEFAULT_SEEDER_GLOB = '!(*.d).{js,ts}';
const ENTITY_EXTENSIONS = 'js,cjs,mjs';
const ENTITY_TS_EXTENSIONS = 'ts,cts,mts';

const toStrings = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).filter((item: unknown): item is string => typeof item === 'string');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMikroOrmOptions = (value: unknown): value is MikroOrmOptions => isRecord(value);

const isMikroOrmPackageJson = (value: unknown): value is MikroOrmPackageJson => isRecord(value) && 'mikro-orm' in value;

const entitySpecialRegex = /[*?{}\[]/u;
const entityFileExtensionRegex = /\.(?:[cm]?[jt]s)$/u;

const toEntityEntry = (specifier: string, extensions: string, baseDir: string): Input => {
  const hasPattern = entitySpecialRegex.test(specifier);
  const hasExtension = entityFileExtensionRegex.test(specifier);
  const pattern = hasPattern || hasExtension ? specifier : join(specifier, `**/*.{${extensions}}`);
  return toProductionEntry(toAbsolute(pattern, baseDir));
};

const toFolderEntries = (paths: string[], glob: string, baseDir: string): Input[] =>
  paths.map(path => toProductionEntry(toAbsolute(join(path, glob), baseDir)));

const resolveConfig: ResolveConfig<MikroOrmConfig> = (config, options) => {
  if (isMikroOrmPackageJson(config)) {
    const configPaths = toStrings(config['mikro-orm']?.configPaths);
    return configPaths.map(path => toConfig('mikro-orm', path, { dir: options.cwd }));
  }

  const configs = (Array.isArray(config) ? config : [config]).filter(isMikroOrmOptions);

  return configs.flatMap(config => {
    const baseDir = typeof config.baseDir === 'string' ? toAbsolute(config.baseDir, options.cwd) : options.cwd;
    const inputs: Input[] = [];
    const entitiesTs = toStrings(config.entitiesTs);
    const entities = entitiesTs.length > 0 ? entitiesTs : toStrings(config.entities);
    const entityExtensions = entitiesTs.length > 0 ? ENTITY_TS_EXTENSIONS : ENTITY_EXTENSIONS;

    inputs.push(...entities.map(path => toEntityEntry(path, entityExtensions, baseDir)));

    if (config.migrations?.migrationsList === undefined) {
      const migrationsTs = toStrings(config.migrations?.pathTs);
      const migrations = migrationsTs.length > 0 ? migrationsTs : toStrings(config.migrations?.path);
      const paths = migrations.length > 0 ? migrations : ['./migrations'];
      inputs.push(...toFolderEntries(paths, config.migrations?.glob ?? DEFAULT_MIGRATIONS_GLOB, baseDir));
    }

    if (config.seeder !== undefined) {
      const seedersTs = toStrings(config.seeder.pathTs);
      const seeders = seedersTs.length > 0 ? seedersTs : toStrings(config.seeder.path);
      const paths = seeders.length > 0 ? seeders : ['./seeders'];
      inputs.push(...toFolderEntries(paths, config.seeder.glob ?? DEFAULT_SEEDER_GLOB, baseDir));
    }

    return inputs;
  });
};

const args: Args = {
  binaries: ['mikro-orm'],
  config: true,
  string: ['contextName'],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  args,
  resolveConfig,
};

export default plugin;
