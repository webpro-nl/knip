import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '#p/types/plugins.js';
import { toAbsolute } from '#p/util/path.js';
import { hasDependency, load } from '#p/util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import { resolveConfig as resolveVitestConfig } from '../vitest/index.js';
import type { LadleConfig } from './types.js';

// https://ladle.dev/docs/config

const title = 'Ladle';

const enablers: EnablerPatterns = ['@ladle/react'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.ladle/config.{mjs,js,ts}'];

const stories = ['src/**/*.stories.{js,jsx,ts,tsx,mdx}'];
const restEntry = ['.ladle/components.{js,jsx,ts,tsx}'];
const entry = [...restEntry, ...stories];

const project = ['.ladle/**/*.{js,jsx,ts,tsx}'];

const resolveEntryPaths: ResolveEntryPaths<LadleConfig> = (localConfig, options) => {
  const localStories = typeof localConfig.stories === 'string' ? [localConfig.stories] : localConfig.stories;
  const viteConfig = localConfig.viteConfig ? [toAbsolute(localConfig.viteConfig, options.cwd)] : [];
  const patterns = [...restEntry, ...(localStories ?? stories), ...viteConfig];
  return patterns.map(toEntryPattern);
};

const resolveConfig: ResolveConfig<LadleConfig> = async (localConfig, options) => {
  if (localConfig.viteConfig) {
    const viteConfigPath = toAbsolute(localConfig.viteConfig, options.cwd);
    const viteConfig = await load(viteConfigPath);
    return resolveVitestConfig(viteConfig, options);
  }
  return [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  project,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;
