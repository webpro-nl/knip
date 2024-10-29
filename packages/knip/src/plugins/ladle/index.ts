import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import { toEntry } from '../../util/input.js';
import { toAbsolute } from '../../util/path.js';
import { hasDependency, load } from '../../util/plugin.js';
import { resolveConfig as resolveVitestConfig } from '../vitest/index.js';
import type { LadleConfig } from './types.js';

// https://ladle.dev/docs/config

const title = 'Ladle';

const enablers = ['@ladle/react'];

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
  return patterns.map(toEntry);
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
