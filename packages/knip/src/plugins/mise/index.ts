import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import { type Input, isEntry } from '../../util/input.ts';
import { basename, dirname, join, toAbsolute } from '../../util/path.ts';
import type { MiseConfig } from './types.ts';

const title = 'mise';

const enablers = 'This plugin is enabled when `mise.toml` or `.mise.toml` is found.';

const config = [
  '{mise,.mise}{,.*}.toml',
  '{mise,.mise}/config{,.*}.toml',
  '.config/mise{,.*}.toml',
  '.config/mise/config{,.*}.toml',
  '.config/mise/mise{,.local}.toml',
  '{mise,.mise}/conf.d/[!.]*.toml',
  '.config/mise/conf.d/[!.]*.toml',
];

const isEnabled: IsPluginEnabled = ({ cwd }) => isFile(cwd, 'mise.toml') || isFile(cwd, '.mise.toml');

const getConfigRoot = (configFileDir: string, configFileName: string) => {
  const isFragment = basename(configFileDir) === 'conf.d';
  const groupedDir = isFragment ? dirname(configFileDir) : configFileDir;
  const name = basename(groupedDir);
  const root =
    (isFragment || configFileName.startsWith('config.')) && (name === 'mise' || name === '.mise')
      ? dirname(groupedDir)
      : configFileDir;
  return basename(root) === '.config' ? dirname(root) : root;
};

const hasTemplate = (value: string) => value.includes('{{') || value.includes('{%');

const resolvePath = (value: string, root: string) => {
  const expanded = value.replace(/\{\{\s*config_root\s*\}\}/g, () => root);
  if (hasTemplate(expanded) || expanded.startsWith('~') || expanded.includes('$')) return;
  return join(toAbsolute(expanded, root), '.');
};

const resolveConfig: ResolveConfig<MiseConfig> = async (localConfig, options) => {
  const { getInputsFromMiseScript } = await import('./scripts.ts');
  const { configFileDir, configFileName, getManifest, isProduction } = options;
  const configRoot = getConfigRoot(configFileDir, configFileName);
  const inputs: Input[] = [];

  for (const task of Object.values(localConfig.tasks ?? {})) {
    const taskConfig = typeof task === 'string' || Array.isArray(task) ? { run: task } : task;
    const dir = resolvePath(taskConfig.dir ?? localConfig.task_config?.dir ?? '.', configRoot);
    if (!dir) continue;

    let hasLocalBinPath = false;
    for (const env of [localConfig.env ?? [], taskConfig.env ?? []].flat()) {
      if (Object.hasOwn(env, 'PATH')) hasLocalBinPath = false;
      const paths = env._?.path;
      for (const path of typeof paths === 'string' ? [paths] : Array.isArray(paths) ? paths : []) {
        if (typeof path === 'string' && resolvePath(path, configRoot) === join(dir, 'node_modules/.bin')) {
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
