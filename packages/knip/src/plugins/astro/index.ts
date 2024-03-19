import { hasDependency } from '#p/util/plugin.js';
import type { IsPluginEnabled, Resolve } from '#p/types/plugins.js';

// https://docs.astro.build/en/reference/configuration-reference/

const title = 'Astro';

const enablers = ['astro'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['astro.config.{js,cjs,mjs,ts}', 'src/content/config.ts'];

const production = ['src/pages/**/*.{astro,mdx,js,ts}', 'src/content/**/*.mdx'];

const resolve: Resolve = options => {
  const { isProduction, manifest } = options;
  const dependencies = [];

  if (
    !isProduction &&
    manifest.scripts &&
    Object.values(manifest.scripts).some(script => /(?<=^|\s)astro(\s|\s.+\s)check(?=\s|$)/.test(script))
  ) {
    dependencies.push('@astrojs/check');
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
} as const;
