import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toConfig, toEntry } from '../../util/input.ts';
import { join, toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type {
  MikroOrmConfig,
  MikroOrmConfigFactory,
  MikroOrmConfigItem,
  MikroOrmOptions,
  MikroOrmPackageJson,
} from './types.ts';

// https://mikro-orm.io/docs/quick-start
// https://mikro-orm.io/docs/configuration
// https://mikro-orm.io/docs/migrations
// https://mikro-orm.io/docs/seeding
// https://github.com/mikro-orm/mikro-orm/blob/v7.2.8/packages/cli/src/CLIHelper.ts#L178
// https://github.com/mikro-orm/mikro-orm/blob/v7.2.8/packages/core/src/metadata/discover-entities.ts#L46

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
const ENTITY_EXTENSIONS = 'js,cjs,mjs,ts,cts,mts';

const toStrings = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).filter((item: unknown): item is string => typeof item === 'string');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMikroOrmOptions = (value: unknown): value is MikroOrmOptions => isRecord(value);

const isMikroOrmPackageJson = (value: unknown): value is MikroOrmPackageJson =>
  isRecord(value) &&
  'configPaths' in value &&
  (typeof value.configPaths === 'string' || Array.isArray(value.configPaths));

const isMikroOrmConfigFactory = (value: unknown): value is MikroOrmConfigFactory => typeof value === 'function';

const isMikroOrmConfigItem = (value: unknown): value is MikroOrmConfigItem =>
  isMikroOrmOptions(value) || isMikroOrmConfigFactory(value);

const entitySpecialRegex = /[*?{}[]/u;
const entityFileExtensionRegex = /\.(?:[cm]?[jt]s)$/u;

const toEntityEntry = (specifier: string, extensions: string, baseDir: string): Input => {
  const hasPattern = entitySpecialRegex.test(specifier);
  const hasExtension = entityFileExtensionRegex.test(specifier);
  const pattern = hasPattern || hasExtension ? specifier : join(specifier, `**/*.{${extensions}}`);
  return toEntry(toAbsolute(pattern, baseDir), { production: true });
};

const toFolderEntries = (paths: string[], glob: string, baseDir: string): Input[] =>
  paths.map(path => toEntry(toAbsolute(join(path, glob), baseDir), { production: true }));

const resolveConfig: ResolveConfig<MikroOrmConfig> = async (config, options) => {
  if (options.configFileName === 'package.json') {
    if (!isMikroOrmPackageJson(config)) return [];

    const configPaths = toStrings(config.configPaths);
    return configPaths.map(path => toConfig('mikro-orm', path, { dir: options.cwd }));
  }

  const configItems = (Array.isArray(config) ? config : [config]).filter(isMikroOrmConfigItem);
  const resolvedConfigs = await Promise.all(
    configItems.map(async configItem =>
      isMikroOrmConfigFactory(configItem) ? await configItem('default') : configItem
    )
  );
  const configs = resolvedConfigs
    .flatMap(config => (Array.isArray(config) ? config : [config]))
    .filter(isMikroOrmOptions);

  return configs.flatMap(config => {
    const baseDir = typeof config.baseDir === 'string' ? toAbsolute(config.baseDir, options.cwd) : options.cwd;
    const inputs: Input[] = [];
    const entities = [...toStrings(config.entities), ...toStrings(config.entitiesTs)];

    inputs.push(...entities.map(path => toEntityEntry(path, ENTITY_EXTENSIONS, baseDir)));

    if (config.migrations?.migrationsList === undefined) {
      const migrationsTs = toStrings(config.migrations?.pathTs);
      const migrations = migrationsTs.length > 0 ? migrationsTs : toStrings(config.migrations?.path);
      const paths = migrations.length > 0 ? migrations : ['./migrations'];
      inputs.push(...toFolderEntries(paths, config.migrations?.glob ?? DEFAULT_MIGRATIONS_GLOB, baseDir));
    }

    const seedersTs = toStrings(config.seeder?.pathTs);
    const seeders = seedersTs.length > 0 ? seedersTs : toStrings(config.seeder?.path);
    const seederPaths = seeders.length > 0 ? seeders : ['./seeders'];
    inputs.push(...toFolderEntries(seederPaths, config.seeder?.glob ?? DEFAULT_SEEDER_GLOB, baseDir));

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
