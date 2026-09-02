import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { get } from '../../util/object.ts';
import type { Manifest } from '../../util/package-json.ts';
import { hasDependency } from '../../util/plugin.ts';
import { scanVarlockFiles } from './scan.ts';

// https://varlock.dev/guides/plugins/

const title = 'Varlock';

const enablers = ['varlock'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const getStrings = (value: unknown) => [value].flat().filter((value): value is string => typeof value === 'string');

const getLoadPaths = (manifest: Manifest) => getStrings(get(manifest, 'varlock.loadPath'));

const resolve: Resolve = options => {
  const loadPaths = getLoadPaths(options.manifest);
  return scanVarlockFiles(loadPaths.length > 0 ? loadPaths : ['.'], options.cwd);
};

const args: Args = {
  alias: { path: ['p'] },
  string: ['path', 'env'],
  fromArgs: parsed => (parsed._[0] === 'run' ? (parsed['--'] ?? []) : []),
  resolveInputs: (parsed, { cwd, manifest }) => {
    const paths = getStrings(parsed.path);
    const loadPaths = getLoadPaths(manifest);
    const environment = getStrings(parsed.env).at(-1);
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
