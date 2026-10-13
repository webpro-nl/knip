import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/solidjs/filesystem-routing
// https://github.com/solidjs/filesystem-routing/blob/90a19eeb5c58becb0b5d599527c99452eab6f1c5/src/vite/index.ts

const title = 'filesystem-routing';

const enablers = ['filesystem-routing'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const production = ['src/routes/**/*.{js,jsx,ts,tsx,tsrx}'];

const note = `Uses the default route directory and extensions. Set the plugin \`entry\` for custom
\`fileRoutes()\` directories or extensions, a custom Vite root, or custom router instances.

Every matching file is a production entry, regardless of \`httpMethods\`. This includes colocated helpers and
tests: their unused exports are not reported, and test dependencies may be reported as unlisted in strict mode.
Override the plugin \`entry\` to narrow the files included.`;

/** @public */
export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
};

export default plugin;
