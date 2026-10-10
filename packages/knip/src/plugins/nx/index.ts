import type { ParsedArgs } from '../../util/parse-args.ts';
import type { IsPluginEnabled, Plugin, PluginOptions, Resolve, ResolveConfig } from '../../types/config.ts';
import { compact } from '../../util/array.ts';
import { isFile, loadJSON } from '../../util/fs.ts';
import { toConfig, toDeferResolveEntry, toDependency } from '../../util/input.ts';
import { dirname, join, relative } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { substringBefore } from '../../util/string.ts';
import type { NxCollection, NxConfigRoot, NxProjectConfiguration } from './types.ts';

const title = 'Nx';

const enablers = ['nx', /^@nrwl\//, /^@nx\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['nx.json', 'project.json', '{apps,libs}/**/project.json', 'package.json'];

const findNxDependenciesInNxJson: ResolveConfig<NxConfigRoot> = async localConfig => {
  const targetsDefault = localConfig.targetDefaults
    ? Object.keys(localConfig.targetDefaults)
        // Ensure we only grab executors from plugins instead of manual targets
        // Limiting to scoped packages to ensure we don't have false positives
        .filter(it => it.includes(':') && it.startsWith('@'))
        .map(it => substringBefore(it, ':'))
    : [];

  const plugins =
    localConfig.plugins && Array.isArray(localConfig.plugins)
      ? localConfig.plugins
          .map(value => (typeof value === 'string' ? value : value.plugin))
          .filter(value => value !== undefined)
      : [];

  const generators = localConfig.generators
    ? Object.keys(localConfig.generators)
        .filter(value => value !== undefined)
        .map(value => substringBefore(value, ':'))
    : [];

  return compact([...targetsDefault, ...plugins, ...generators]).map(id => toDependency(id));
};

const resolveConfig: ResolveConfig<NxProjectConfiguration | NxConfigRoot> = async (localConfig, options) => {
  const { configFileName } = options;

  if (configFileName === 'nx.json') {
    return findNxDependenciesInNxJson(localConfig as NxConfigRoot, options);
  }

  const config = localConfig as NxProjectConfiguration;

  const targets = config.targets ? Object.values(config.targets) : [];

  const executors = targets
    .map(target => target?.executor)
    .filter(executor => executor && !executor.startsWith('.'))
    .map(executor => executor && substringBefore(executor, ':'));

  const expand = (value: string) =>
    value.replaceAll('{projectRoot}', options.configFileDir).replaceAll('{workspaceRoot}', options.rootCwd);

  const resolveTargetCwd = (targetCwd: string | undefined) => {
    if (!targetCwd) return options.cwd;
    const expanded = expand(targetCwd);
    return expanded === targetCwd ? join(options.cwd, targetCwd) : expanded;
  };

  const inputs = targets
    .filter(target => target.executor === 'nx:run-commands' || target.command)
    .flatMap(target => {
      let commands: string[] = [];
      if (target.command) commands = [target.command];
      else if (target.options?.command) commands = [target.options.command];
      else if (target.options?.commands)
        commands = target.options.commands.map(commandConfig =>
          typeof commandConfig === 'string' ? commandConfig : commandConfig.command
        );
      const cwd = resolveTargetCwd(target.options?.cwd);
      // Relative roots keep a cwd with spaces or parentheses out of the command
      const expandRelative = (command: string) =>
        command
          .replaceAll('{projectRoot}', relative(cwd, options.configFileDir))
          .replaceAll('{workspaceRoot}', relative(cwd, options.rootCwd));
      return options.getInputsFromScripts(commands.map(expandRelative), { cwd });
    });

  const configInputs = targets.flatMap(target => {
    const opts = target.options;
    if (!opts) return [];

    const configs = [];

    if ('eslintConfig' in opts && typeof opts.eslintConfig === 'string') {
      configs.push(toConfig('eslint', opts.eslintConfig));
    }

    if ('jestConfig' in opts && typeof opts.jestConfig === 'string') {
      configs.push(toConfig('jest', opts.jestConfig));
    }

    if ('tsConfig' in opts && typeof opts.tsConfig === 'string') {
      configs.push(toConfig('typescript', opts.tsConfig));
    }

    if ('vitestConfig' in opts && typeof opts.vitestConfig === 'string') {
      configs.push(toConfig('vitest', opts.vitestConfig));
    }

    if ('webpackConfig' in opts && typeof opts.webpackConfig === 'string') {
      configs.push(toConfig('webpack', opts.webpackConfig));
    }

    return configs;
  });

  return compact([...executors, ...inputs, ...configInputs]).map(id =>
    typeof id === 'string' ? toDependency(id) : id
  );
};

const collections = [
  ['generators', 'schematics'],
  ['executors', 'builders'],
] as const;

const resolveCollections: Resolve = async (options: PluginOptions) => {
  const inputs = [];
  const manifest = options.manifest as Record<string, unknown>;
  for (const [key, alias] of collections) {
    const file = manifest[key] ?? manifest[alias];
    if (typeof file !== 'string') continue;
    const filePath = join(options.cwd, file);
    if (!isFile(filePath)) continue;

    const collection = (await loadJSON(filePath)) as NxCollection;
    for (const entries of [collection[key], collection[alias]]) {
      for (const entry of Object.values(entries ?? {})) {
        if (typeof entry === 'string' || !entry || typeof entry !== 'object') continue;
        for (const id of [entry.implementation, entry.factory, entry.batchImplementation]) {
          if (typeof id === 'string' && id.length > 0) {
            inputs.push(toDeferResolveEntry(join(dirname(filePath), substringBefore(id, '#'))));
          }
        }
      }
    }
  }
  return inputs;
};

const args = {
  fromArgs: (parsed: ParsedArgs) => (parsed._[0] === 'exec' ? [...parsed._.slice(1), ...(parsed['--'] ?? [])] : []),
};

/** @public */
export const docs = {
  note: `Also see [integrated monorepos](/features/integrated-monorepos) and the note regarding internal workspace dependencies.`,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  resolve: resolveCollections,
  args,
};

export default plugin;
