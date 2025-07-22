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
const project = ['src/**/*'];

const production = [
  'src/pages/**/*.{astro,mdx,js,ts}',
  '!src/pages/**/_*', // negate files prefixed with _
  '!src/pages/**/_*/**', // negate folders prefixed with _. '_**' would be collapsed into '_*' so we have to use '**/_*/**'
  'src/content/**/*.mdx',
  'src/middleware.{js,ts}',
  'src/actions/index.{js,ts}',
];

const resolveFromAST: ResolveFromAST = sourceFile => {
  const srcDir = getSrcDir(sourceFile);
  const setSrcDir = (entry: string) => entry.replace(/^`src\//, `${srcDir}/`);

  return [
    ...entry.map(setSrcDir).map(path => toEntry(path)),
    ...production.map(setSrcDir).map(path => toProductionEntry(path)),
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
  project,
} satisfies Plugin;
