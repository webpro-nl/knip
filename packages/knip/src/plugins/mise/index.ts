import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import { type Input, isEntry } from '../../util/input.ts';
import { join, toAbsolute } from '../../util/path.ts';
import type { MiseConfig } from './types.ts';

const title = 'mise';

const enablers = 'This plugin is enabled when `mise.toml` or `.mise.toml` is found.';

const config = ['mise.toml', '.mise.toml'];

const isEnabled: IsPluginEnabled = ({ cwd }) => config.some(file => isFile(cwd, file));

const hasTemplate = (value: string) => value.includes('{{') || value.includes('{%');

const resolvePath = (value: string, root: string) => {
  const expanded = value.replace(/\{\{\s*config_root\s*\}\}/g, () => root);
  if (hasTemplate(expanded) || expanded.startsWith('~') || expanded.includes('$')) return;
  return join(toAbsolute(expanded, root), '.');
};

const resolveConfig: ResolveConfig<MiseConfig> = async (localConfig, options) => {
  const { getInputsFromMiseScript } = await import('./scripts.ts');
  const { configFileDir, getManifest, isProduction } = options;
  const inputs: Input[] = [];

  for (const task of Object.values(localConfig.tasks ?? {})) {
    const taskConfig = typeof task === 'string' || Array.isArray(task) ? { run: task } : task;
    const dir = resolvePath(taskConfig.dir ?? localConfig.task_config?.dir ?? '.', configFileDir);
    if (!dir) continue;

    let hasLocalBinPath = false;
    for (const env of [localConfig.env ?? [], taskConfig.env ?? []].flat()) {
      if (Object.hasOwn(env, 'PATH')) hasLocalBinPath = false;
      const paths = env._?.path;
      for (const path of typeof paths === 'string' ? [paths] : Array.isArray(paths) ? paths : []) {
        if (typeof path === 'string' && resolvePath(path, configFileDir) === join(dir, 'node_modules/.bin')) {
          hasLocalBinPath = true;
        }
      }
    }

    const manifest = getManifest(dir) ?? options.manifest;
    const scriptOptions = {
      ...options,
      cwd: dir,
      manifest,
      containingFilePath: options.configFilePath,
    };
    for (const script of [taskConfig.run ?? [], taskConfig.run_windows ?? []].flat()) {
      if (typeof script !== 'string' || hasTemplate(script)) continue;
      for (const input of getInputsFromMiseScript(script, scriptOptions, hasLocalBinPath)) {
        if (isProduction) input.optional = true;
        input.dir ??= dir;
        if (isEntry(input)) input.specifier = toAbsolute(input.specifier, input.dir);
        inputs.push(input);
      }
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
