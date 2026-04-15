import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { toDependency, toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://react.email/docs/cli

const title = 'React Email';

const enablers = ['react-email'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['emails/**/*.tsx'];

const previewCommands = new Set(['build', 'dev', 'start']);

const args: Args = {
  binaries: ['email'],
  resolveInputs: parsed => {
    const inputs = [];
    if (previewCommands.has(parsed._[0])) inputs.push(toDependency('@react-email/preview-server'));
    if (parsed.dir) inputs.push(toEntry(`${parsed.dir}/**/*.tsx`));
    return inputs;
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  args,
};

export default plugin;
