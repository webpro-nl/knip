import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { toEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://vitepress.dev/
// https://vitepress.dev/reference/cli

const title = 'VitePress';

const enablers = ['vitepress'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = [
  '.vitepress/config.{js,ts,mjs,mts,cjs,cts}',
  '.vitepress/config/index.{js,ts,mjs,mts,cjs,cts}',
  '.vitepress/theme/index.{js,ts,mjs,mts}',
];

const commands = new Set(['dev', 'build', 'preview', 'serve']);

const args: Args = {
  resolveInputs: parsed => {
    const [command, root] = parsed._;
    const inputs = [];
    if (root && commands.has(command)) for (const pattern of entry) inputs.push(toEntry(join(root, pattern)));
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
