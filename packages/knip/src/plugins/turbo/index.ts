import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import type { Args } from '../../types/args.ts';
import { toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://turborepo.com/docs/guides/generating-code
// https://turborepo.com/docs/reference/generate

const title = 'Turborepo';

const enablers = ['turbo', '@turbo/gen'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

// https://github.com/vercel/turborepo/blob/v2.11.2/packages/turbo-gen/src/utils/plop.ts
const extensions = '{ts,js,cjs,mts,mjs}';

const entry = [`turbo/generators/config.${extensions}`];

const resolve: Resolve = ({ cwd, rootCwd }) => (cwd === rootCwd ? [toEntry(`plopfile.${extensions}`)] : []);

const args: Args = {
  string: ['config'],
  resolveInputs: parsed =>
    (parsed._[0] === 'gen' || parsed._[0] === 'generate') && typeof parsed.config === 'string'
      ? [toEntry(parsed.config)]
      : [],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  resolve,
  args,
};

export default plugin;
