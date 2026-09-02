import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { scanVarlockFiles } from './scan.ts';

// https://varlock.dev/guides/plugins/

const title = 'Varlock';

const enablers = ['varlock'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const getPaths = (value: unknown) => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.filter((path): path is string => typeof path === 'string');
  return [];
};

const getLoadPaths = (manifest: { varlock?: unknown }) => {
  if (!manifest.varlock || typeof manifest.varlock !== 'object' || !('loadPath' in manifest.varlock)) return [];
  return getPaths(manifest.varlock.loadPath);
};

const resolve: Resolve = options => {
  const loadPaths = getLoadPaths(options.manifest);
  return scanVarlockFiles(loadPaths.length > 0 ? loadPaths : ['.env.schema'], options.cwd);
};

const args: Args = {
  alias: { path: ['p'] },
  string: ['path'],
  resolveInputs: (parsed, { cwd }) => scanVarlockFiles(getPaths(parsed.path), cwd),
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  args,
  resolve,
};

export default plugin;
