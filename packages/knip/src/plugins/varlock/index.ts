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

const getEnvironment = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i--) if (typeof value[i] === 'string') return value[i];
  }
};

const resolve: Resolve = options => {
  const loadPaths = getLoadPaths(options.manifest);
  return scanVarlockFiles(loadPaths.length > 0 ? loadPaths : ['.'], options.cwd);
};

const args: Args = {
  alias: { path: ['p'] },
  string: ['path', 'env'],
  fromArgs: parsed => (parsed._[0] === 'run' ? (parsed['--'] ?? []) : []),
  resolveInputs: (parsed, { cwd, manifest }) => {
    const paths = getPaths(parsed.path);
    const loadPaths = getLoadPaths(manifest);
    const environment = getEnvironment(parsed.env);
    return scanVarlockFiles(
      paths.length > 0 ? paths : environment ? (loadPaths.length > 0 ? loadPaths : ['.']) : [],
      cwd,
      environment
    );
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  args,
  resolve,
};

export default plugin;
