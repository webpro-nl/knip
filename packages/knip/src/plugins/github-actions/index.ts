import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Dependency, isDeferResolveEntry, toEntry } from '../../util/dependencies.js';
import { _firstGlob } from '../../util/glob.js';
import { findByKeyDeep } from '../../util/object.js';
import { join, relative } from '../../util/path.js';

// https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions

const title = 'GitHub Actions';

const enablers = 'This plugin is enabled when a `.yml` or `.yaml` file is found in the `.github/workflows` folder.';

const isEnabled: IsPluginEnabled = async ({ cwd }) =>
  Boolean(await _firstGlob({ cwd, patterns: ['.github/workflows/*.{yml,yaml}'] }));

const config = ['.github/workflows/*.{yml,yaml}', '.github/**/action.{yml,yaml}'];

const isString = (value: unknown): value is string => typeof value === 'string';

type Step = {
  run?: string;
  uses?: string;
  with?: {
    path: string;
  };
  'working-directory'?: string;
};

type Steps = Step[];

type Job = {
  steps: Steps;
};

const resolveConfig: ResolveConfig = async (config, options) => {
  const { configFileDir, configFileName, rootCwd, getDependenciesFromScripts } = options;

  const dependencies = new Set<Dependency>();

  const jobs = findByKeyDeep<Job>(config, 'steps');

  for (const steps of jobs) {
    const action = steps.steps.find(
      step => step.uses?.startsWith('actions/checkout@') && typeof step.with?.path === 'string'
    );
    const path = action?.with?.path;
    for (const step of steps.steps) {
      const workingDir = step['working-directory'];
      const dir = join(rootCwd, path && workingDir ? relative(workingDir, path) : workingDir ? workingDir : '.');
      if (step.run) {
        for (const dependency of getDependenciesFromScripts([step.run], { knownGlobalsOnly: true })) {
          if (isDeferResolveEntry(dependency) && path && !workingDir)
            dependency.specifier = relative(join(dir, path), join(rootCwd, dependency.specifier));
          dependencies.add({ ...dependency, dir });
        }
      }
    }
  }

  const getActionDependencies = () => {
    const isActionManifest = configFileName === 'action.yml' || configFileName === 'action.yaml';
    if (!(isActionManifest && config?.runs?.using?.startsWith('node'))) return [];
    const scripts = [config.runs.pre, config.runs.main, config.runs.post].filter(isString);
    return scripts.map(script => join(configFileDir, script));
  };

  return [...getActionDependencies().map(toEntry), ...dependencies];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
