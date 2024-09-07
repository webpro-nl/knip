import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '#p/types/plugins.js';
import { hasDependency, resolveEntry } from '#p/util/plugin.js';
import { join } from '../../util/path.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { ReactCosmosConfig } from './types.js';

// https://reactcosmos.org/docs

const title = 'React Cosmos';

const enablers: EnablerPatterns = ['react-cosmos'];

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
  return [...entries, ...decoratorEntry].map(toEntryPattern);
};

const resolveConfig: ResolveConfig<ReactCosmosConfig> = async (localConfig, options) => {
  const dependencies = (localConfig?.plugins ?? []).map(specifier => resolveEntry(options, specifier));
  return [...dependencies];
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
