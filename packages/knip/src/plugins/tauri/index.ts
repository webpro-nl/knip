import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { Input } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { TauriConfig } from './types.ts';

// https://v2.tauri.app/reference/config/

const title = 'Tauri';

const enablers = ['@tauri-apps/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  'src-tauri/tauri.conf.{json,json5}',
  'src-tauri/tauri.{macos,linux,windows,android,ios}.conf.{json,json5}',
  'src-tauri/Tauri.toml',
  'src-tauri/Tauri.{macos,linux,windows,android,ios}.toml',
  'tauri.conf.{json,json5}',
];

const resolveConfig: ResolveConfig<TauriConfig> = async (localConfig, options) => {
  const build = localConfig.build;
  const commands = [
    build?.beforeDevCommand ?? build?.['before-dev-command'],
    build?.beforeBuildCommand ?? build?.['before-build-command'],
    build?.beforeBundleCommand ?? build?.['before-bundle-command'],
  ];

  const inputs: Input[] = [];
  for (const command of commands) {
    if (!command) continue;
    const script = typeof command === 'string' ? command : command.script;
    if (!script) continue;
    const dir = typeof command === 'string' || !command.cwd ? options.cwd : join(options.cwd, command.cwd);
    const manifest = options.getManifest(dir) ?? options.manifest;
    for (const input of options.getInputsFromScripts(script, { knownBinsOnly: true, cwd: dir, manifest })) {
      inputs.push({ ...input, dir });
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
