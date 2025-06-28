import type { IsPluginEnabled, Plugin, Resolve, ResolveFromAST } from '../../types/config.js';
import { toDependency, toEntry, toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { getSrcDir } from './resolveFromAST.js';

// https://docs.astro.build/en/reference/configuration-reference/

const title = 'Astro';

const enablers = ['astro'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['astro.config.{js,cjs,mjs,ts,mts}'];

const entry = ['src/content/config.ts', 'src/content.config.ts'];

const production = [
  'src/pages/**/*.{astro,mdx,js,ts}',
  'src/content/**/*.mdx',
  'src/middleware.{js,ts}',
  'src/actions/index.{js,ts}',
];

const resolveFromAST: ResolveFromAST = sourceFile => {
  const srcDir = getSrcDir(sourceFile);

  return [
    ...[`${srcDir}/content/config.ts`, `${srcDir}/content.config.ts`].map(path => toEntry(path)),

    ...[
      `${srcDir}/pages/**/*.{astro,mdx,js,ts}`,
      `${srcDir}/content/**/*.mdx`,
      `${srcDir}/middleware.{js,ts}`,
      `${srcDir}/actions/index.{js,ts}`,
    ].map(path => toProductionEntry(path)),
  ];
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
  entry,
  production,
  resolveFromAST,
  resolve,
} satisfies Plugin;
