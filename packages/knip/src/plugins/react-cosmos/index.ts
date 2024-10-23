import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import { toDeferResolve, toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { ReactCosmosConfig } from './types.js';

// https://reactcosmos.org/docs

const title = 'React Cosmos';

const enablers = ['react-cosmos'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['cosmos.config.json'];

const ext = '{js,jsx,ts,tsx,md,mdx}';

const fixtureEntry = [`**/*.fixture.${ext}`, `__fixtures__/**/*.${ext}`, `**/fixture.${ext}`];

const decoratorEntry = ['**/cosmos.decorator.{jsx,tsx}'];

const entry = [...fixtureEntry, ...decoratorEntry];

const resolveEntryPaths: ResolveEntryPaths<ReactCosmosConfig> = async localConfig => {
  const { fixturesDir, fixtureFileSuffix } = localConfig;
  const entries = [
    join(fixturesDir ?? '__fixtures__', `**/*.${ext}`),
    join(fixturesDir ?? '', `**/*.${fixtureFileSuffix ?? 'fixture'}.${ext}`),
    join(fixturesDir ?? '', `**/${fixtureFileSuffix ?? 'fixture'}.${ext}`),
  ];
  return [...entries, ...decoratorEntry].map(toEntry);
};

const resolveConfig: ResolveConfig<ReactCosmosConfig> = async localConfig => {
  return (localConfig?.plugins ?? []).map(toDeferResolve);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  resolveEntryPaths,
} satisfies Plugin;
