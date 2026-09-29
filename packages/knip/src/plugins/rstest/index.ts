import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { arrayify } from '../../util/array.ts';
import { findFileWithExtensions } from '../../util/fs.ts';
import { _dirGlob, _glob, negate } from '../../util/glob.ts';
import { type Input, toAlias, toConfig, toDeferResolve, toDependency, toEntry } from '../../util/input.ts';
import { dirname, join, relative, toAbsolute } from '../../util/path.ts';
import { hasDependency, load } from '../../util/plugin.ts';
import type { RstestConfigOrFn, RstestProjectConfig } from './types.ts';
import { createRstestMockVisitor } from './visitors/mock.ts';

// https://rstest.rs/

const title = 'Rstest';

const enablers = ['@rstest/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const configExtensions = ['.mts', '.mjs', '.ts', '.js', '.cjs', '.cts'];

// https://rstest.rs/guide/basic/configure-rstest#configuration-file
const config: string[] = ['rstest.config.{js,cjs,mjs,ts,cts,mts}'];

// https://rstest.rs/api/rstest/mockModules#rsmock
const mocks = ['**/__mocks__/**/*.?(c|m)[jt]s?(x)'];

// https://rstest.rs/config/test/include
const testEntry = ['**/*.{test,spec}.?(c|m)[jt]s?(x)'];

const entry = [...testEntry, ...mocks];

const getEnvironmentDependency = (name: string | undefined) => (name && name !== 'node' ? [toDependency(name)] : []);

// https://rstest.rs/config/test/root#rootdir
const replaceRootDir = (path: string, root: string) => path.replace('<rootDir>', root);

// https://github.com/web-infra-dev/rsbuild/blob/v2.2.7/packages/core/src/loadConfig.ts#L94-L108
const configParams = { env: 'test', command: 'run', envMode: 'test' };

const getConfig = async (config: RstestConfigOrFn) =>
  typeof config === 'function' ? await config(configParams) : config;

const resolveConfig: ResolveConfig<RstestConfigOrFn> = async (localConfig, options) => {
  const { cwd, configFileDir, configFilePath, getManifest, isResolvedConfigFile } = options;
  const cfg = await getConfig(localConfig);
  const runnerRoot = toAbsolute(cfg.root ?? '.', isResolvedConfigFile ? configFileDir : cwd);
  const manifest = getManifest(cwd);
  const seen = new Set([configFilePath]);
  const inputs: Input[] = [];

  const addProject = async (project: RstestProjectConfig, projectRoot: string) => {
    const toPattern = (pattern: string) => relative(cwd, toAbsolute(replaceRootDir(pattern, projectRoot), projectRoot));

    if (!options.config.entry) {
      const include: string[] = [];
      const exclude = [...(Array.isArray(project.exclude) ? project.exclude : (project.exclude?.patterns ?? []))];
      for (const pattern of [...(project.include ?? testEntry), ...mocks]) {
        if (pattern.startsWith('!')) exclude.push(pattern.slice(1));
        else include.push(toPattern(pattern));
      }
      const entries =
        exclude.length === 0
          ? include
          : await _glob({ cwd, patterns: [...include, ...exclude.map(pattern => negate(toPattern(pattern)))] });
      for (const entry of entries) inputs.push(toEntry(entry));
    }

    const env = project.testEnvironment;
    inputs.push(...getEnvironmentDependency(typeof env === 'string' ? env : env?.name));

    for (const specifier of [project.setupFiles ?? [], project.globalSetup ?? []].flat()) {
      inputs.push(toDeferResolve(replaceRootDir(specifier, projectRoot), { dir: projectRoot }));
    }

    if (project.browser?.enabled) {
      inputs.push(toDependency('@rstest/browser'), toDependency('playwright'));
    }

    // https://rsbuild.rs/config/resolve/alias
    for (const [name, value] of Object.entries(project.resolve?.alias ?? {})) {
      const prefixes: string[] = [];
      for (const target of arrayify(value)) prefixes.push(target.startsWith('.') ? join(runnerRoot, target) : target);
      if (name.endsWith('$')) {
        inputs.push(toAlias(name.slice(0, -1), prefixes));
      } else {
        inputs.push(
          toAlias(name, prefixes),
          toAlias(
            `${name}/*`,
            prefixes.map(prefix => `${prefix}/*`)
          )
        );
      }
    }
  };

  // https://github.com/web-infra-dev/rstest/blob/v0.12.0/packages/core/src/cli/init.ts#L405-L508
  const addProjects = async (projects: (string | RstestProjectConfig)[], projectsRoot: string) => {
    const patterns: string[] = [];
    for (const project of projects) {
      if (typeof project === 'string') patterns.push(replaceRootDir(project, projectsRoot));
      else
        await addProject(project, toAbsolute(replaceRootDir(project.root ?? projectsRoot, projectsRoot), runnerRoot));
    }
    const [files, dirs] = await Promise.all([
      _glob({ cwd: projectsRoot, patterns, gitignore: false }),
      _dirGlob({ cwd: projectsRoot, patterns, gitignore: false }),
    ]);
    for (const dir of dirs) {
      const projectRoot = toAbsolute(dir, projectsRoot);
      const filePath = findFileWithExtensions(join(projectRoot, 'rstest.config'), configExtensions);
      if (filePath) files.push(filePath);
      else await addProject({}, projectRoot);
    }
    for (const filePath of files) {
      if (seen.has(filePath)) continue;
      seen.add(filePath);
      const project =
        getManifest(dirname(filePath)) === manifest
          ? await load(filePath)
              .then(getConfig)
              .catch(() => undefined)
          : undefined;
      if (!project) {
        inputs.push(toConfig('rstest', filePath, { containingFilePath: configFilePath }));
        continue;
      }
      inputs.push(toEntry(filePath));
      if (project.projects) await addProjects(project.projects, dirname(filePath));
      else await addProject(project, toAbsolute(project.root ?? dirname(filePath), runnerRoot));
    }
  };

  if (cfg.projects) await addProjects(cfg.projects, runnerRoot);
  else await addProject(cfg, runnerRoot);

  if (!isResolvedConfigFile) {
    inputs.push(toDependency(`@rstest/coverage-${cfg.coverage?.provider ?? 'istanbul'}`, { optional: true }));
  }

  return inputs;
};

// https://rstest.rs/guide/basic/cli
const args: Args = {
  config: true,
  resolveInputs: parsed => getEnvironmentDependency(parsed.testEnvironment),
};

const registerVisitors: Plugin['registerVisitors'] = ({ ctx, registerVisitor }) => {
  registerVisitor(createRstestMockVisitor(ctx));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  args,
  registerVisitors,
};

export default plugin;
