import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { BufGenConfig } from './types.ts';

// https://buf.build/docs/configuration/v2/buf-gen-yaml/
// https://github.com/bufbuild/buf/blob/afbfe6a3fd0932ea8c655e89382f600bc875f3b0/private/bufpkg/bufconfig/buf_gen_yaml_file.go
// https://github.com/bufbuild/buf/blob/afbfe6a3fd0932ea8c655e89382f600bc875f3b0/private/bufpkg/bufconfig/generate_plugin_config.go
const title = 'Buf';

const enablers = ['@bufbuild/buf', '@bufbuild/protoc-gen-es'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['buf.gen.yaml'];

const resolveConfig: ResolveConfig<BufGenConfig> = (config, { configFilePath }) => {
  const inputs: Input[] = [];
  for (const plugin of config.plugins ?? []) {
    const command = typeof plugin.local === 'string' ? plugin.local : plugin.local?.[0];
    if (command === 'protoc-gen-es') {
      inputs.push(toDependency('@bufbuild/protoc-gen-es', { containingFilePath: configFilePath }));
    }
  }
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
