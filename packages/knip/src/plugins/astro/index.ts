import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.js';
import { toDependency } from '../../util/dependencies.js';
import { hasDependency } from '../../util/plugin.js';

// https://docs.astro.build/en/reference/configuration-reference/

const title = 'Astro';

const enablers = ['astro'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['astro.config.{js,cjs,mjs,ts}', 'src/content/config.ts'];

const production = ['src/pages/**/*.{astro,mdx,js,ts}', 'src/content/**/*.mdx'];

const resolve: Resolve = options => {
  const { manifest, isProduction } = options;
  const dependencies = [];

  if (
    !isProduction &&
    manifest.scripts &&
    Object.values(manifest.scripts).some(script => /(?<=^|\s)astro(\s|\s.+\s)check(?=\s|$)/.test(script))
  ) {
    dependencies.push(toDependency('@astrojs/check'));
  }

  return dependencies;
};

export default {
  title,
  enablers,
  isEnabled,
  entry,
  production,
  resolve,
} satisfies Plugin;
