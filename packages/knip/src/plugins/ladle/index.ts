import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveEntryPaths } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import type { LadleConfig } from './types.js';
import { toEntryPattern } from '../../util/protocols.js';

// https://ladle.dev/docs/config

const title = 'ladle';

const enablers: EnablerPatterns = [/^@ladle\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.ladle/config.{mjs,js,ts}'];

const stories: string[] = ['**/*.@(stories.@(mdx|js|jsx|mjs|ts|tsx))'];
const restEntry: string[] = ['.ladle/components.{js,jsx,ts,tsx}', 'head.html'];
const entry: string[] = [...restEntry, ...stories];

const project = ['.ladle/**/*.{js,jsx,ts,tsx}'];

const resolveEntryPaths: ResolveEntryPaths<LadleConfig> = async localConfig => {
  const localStories = typeof localConfig.stories === 'string' ? [localConfig.stories] : localConfig.stories;
  const localViteConfig = localConfig.viteConfig ? [localConfig.viteConfig] : [];

  const patterns = [...restEntry, ...(localStories ?? stories), ...localViteConfig];

  return patterns.map(toEntryPattern);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  project,
  resolveEntryPaths,
} satisfies Plugin;
