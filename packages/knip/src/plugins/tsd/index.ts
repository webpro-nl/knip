import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { Input } from '../../util/input.ts';
import { toEntry } from '../../util/input.ts';
import type { ParsedArgs } from '../../util/parse-args.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { TsdConfig } from './types.ts';

// https://github.com/tsdjs/tsd

const title = 'tsd';

const enablers = ['tsd'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const entry = ['*.test-d.{ts,tsx}', 'test-d/**/*.test-d.{ts,tsx}'];

const resolveConfig: ResolveConfig<TsdConfig> = async localConfig => {
  const inputs: Input[] = [];
  if (localConfig?.testFiles) for (const id of localConfig.testFiles) inputs.push(toEntry(id));
  if (localConfig?.directory) {
    inputs.push(toEntry('*.test-d.{ts,tsx}'));
    inputs.push(toEntry(`${localConfig.directory}/**/*.test-d.{ts,tsx}`));
  }
  if (inputs.length === 0) for (const id of entry) inputs.push(toEntry(id));
  return inputs;
};

const args = {
  alias: { files: ['f'], typings: ['t'] },
  string: ['files', 'typings'],
  resolveInputs: (parsed: ParsedArgs) => {
    const inputs: Input[] = [];
    for (const id of [parsed.files ?? []].flat()) inputs.push(toEntry(String(id)));
    if (typeof parsed._[0] === 'string') inputs.push(toEntry(`${parsed._[0]}/**/*.test-d.{ts,tsx}`));
    return inputs;
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  args,
};

export default plugin;
