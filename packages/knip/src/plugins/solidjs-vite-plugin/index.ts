import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { config } from '../vite/index.ts';
import { production, resolveFromAST } from './resolveFromAST.ts';

// https://github.com/solidjs/solid-vite-plugin/blob/next/README.md
// https://github.com/solidjs/solid-vite-plugin/blob/44d90fd7fb8ae6d0efc6a42c82ad2d91adc3658a/src/ssr/index.ts#L417-L620

const title = '@solidjs/vite-plugin';

const enablers = ['@solidjs/vite-plugin'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const note = `Without a Vite config, the default entry patterns are used. With a config, start entries are only added when \`start\` is enabled. Paths like \`start.app\` replace the matching default. \`serverFunctions.configure\` is added with or without \`start\`.`;

/** @public */
export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
};

export default plugin;
