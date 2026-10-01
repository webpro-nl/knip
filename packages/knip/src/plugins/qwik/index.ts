import MDX from '../../compilers/mdx.ts';
import type { IsPluginEnabled, Plugin, RegisterCompilers } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { config } from '../vite/index.ts';
import { entry, production, resolveFromAST, routeProduction } from './resolveFromAST.ts';

// https://qwik.dev/docs/project-structure/

const title = 'Qwik';

const enablers = ['@builder.io/qwik'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  if (hasDependency('@builder.io/qwik-city')) {
    registerCompiler({ extension: '.mdx', compiler: MDX.compiler });
  }
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production: [...production, ...routeProduction],
  registerCompilers,
  resolveFromAST,
};

export default plugin;
