import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { production, resolveFromAST } from './resolveFromAST.ts';

// https://nextjs.org/docs/pages/building-your-application/configuring/mdx

const title = 'Next.js MDX';

const enablers = ['@next/mdx'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['next.config.{js,ts,cjs,mjs,mts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
};

export default plugin;
