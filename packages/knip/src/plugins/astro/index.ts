import type { IsPluginEnabled, Plugin, RegisterCompilers, Resolve } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import compiler from './compiler.ts';
import mdxCompiler from './compiler-mdx.ts';
import { entry, production, resolveFromAST } from './resolveFromAST.ts';

// https://docs.astro.build/en/reference/configuration-reference/

const title = 'Astro';

const enablers = ['astro'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['astro.config.{js,cjs,mjs,ts,mts}'];

// https://docs.astro.build/en/guides/integrations-guide/mdx/
const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  if (hasDependency('astro')) registerCompiler({ extension: '.astro', compiler });
  if (hasDependency('@astrojs/mdx') || hasDependency('@astrojs/starlight')) {
    registerCompiler({ extension: '.mdx', compiler: mdxCompiler });
  }
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

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  registerCompilers,
  resolveFromAST,
  resolve,
};

export default plugin;
