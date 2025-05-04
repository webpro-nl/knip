import type { IsPluginEnabled, Plugin, Resolve, ResolveEntryPaths } from '../../types/config.js';
import { toDependency, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';

// https://docs.astro.build/en/reference/configuration-reference/

const title = 'Astro';

const enablers = ['astro'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['astro.config.{js,cjs,mjs,ts,mts}'];

const resolveEntryPaths: ResolveEntryPaths = async config => {
  const srcDir = config?.srcDir ?? './src';

  return [
    `${srcDir}/content/config.ts`,
    `${srcDir}/content.config.ts`,
    `${srcDir}/content/**/*.mdx`,
    `${srcDir}/pages/**/*.{astro,mdx,js,ts}`,
    `${srcDir}/middleware.{js,ts}`,
    `${srcDir}/actions/index.{js,ts}`,
  ].map(path => toEntry(path));
};

const resolve: Resolve = options => {
  const { manifest, isProduction } = options;
  const inputs = [];

  if (
    !isProduction &&
    manifest.scripts &&
    Object.values(manifest.scripts).some(script => /(?<=^|\s)astro(\s|\s.+\s)check(?=\s|$)/.test(script))
  ) {
    inputs.push(toDependency('@astrojs/check'));
  }

  return inputs;
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveEntryPaths,
  resolve,
} satisfies Plugin;
