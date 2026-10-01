import MDX from '../../compilers/mdx.ts';
import type { IsPluginEnabled, Plugin, RegisterCompilers } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://fumadocs.dev

const title = 'Fumadocs';

const enablers = ['fumadocs-core', 'fumadocs-mdx', 'fumadocs-ui'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['source.config.{js,ts,mjs}', 'content/**/*.mdx'];

const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  if (hasDependency('fumadocs-mdx')) registerCompiler({ extension: '.mdx', compiler: MDX.compiler });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  registerCompilers,
};

export default plugin;
