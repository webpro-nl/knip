import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { Input } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toShellCommand } from '../../util/scripts.ts';
import type { BufGenConfig } from './types.ts';

// https://buf.build/docs/configuration/v2/buf-gen-yaml/
// https://github.com/bufbuild/buf/blob/afbfe6a3fd0932ea8c655e89382f600bc875f3b0/private/bufpkg/bufconfig/buf_gen_yaml_file.go
// https://github.com/bufbuild/buf/blob/afbfe6a3fd0932ea8c655e89382f600bc875f3b0/private/bufpkg/bufconfig/generate_plugin_config.go
const title = 'Buf';

const enablers = ['@bufbuild/buf', '@bufbuild/protoc-gen-es'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['buf.gen.yaml'];

const args: Args = {
  config: ['template'],
};

const resolveConfig: ResolveConfig<BufGenConfig> = (config, options) => {
  const inputs: Input[] = [];
  for (const plugin of config.plugins ?? []) {
    const name = plugin.plugin ?? plugin.name;
    const command = plugin.local ?? plugin.path ?? (name && !name.includes('/') ? `protoc-gen-${name}` : undefined);
    if (!command) continue;
    const script = toShellCommand(typeof command === 'string' ? [command] : command);
    for (const input of options.getInputsFromScripts(script, { optionalBinaries: true })) {
      input.dir ??= options.cwd;
      inputs.push(input);
    }
  }
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  args,
  resolveConfig,
};

export default plugin;
