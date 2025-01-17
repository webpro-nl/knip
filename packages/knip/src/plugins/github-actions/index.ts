import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig } from '../../types/config.js';
import { _firstGlob } from '../../util/glob.js';
import { type Input, isDeferResolveEntry, toEntry } from '../../util/input.js';
import { findByKeyDeep } from '../../util/object.js';
import { join, relative } from '../../util/path.js';
import type { Job, Runs } from './types.js';

// https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions

const title = 'GitHub Actions';

const enablers = 'This plugin is enabled when a `.yml` or `.yaml` file is found in the `.github/workflows` folder.';

const isEnabled: IsPluginEnabled = async ({ cwd }) =>
  Boolean(await _firstGlob({ cwd, patterns: ['.github/workflows/*.{yml,yaml}'] }));

const isRootOnly = true;

const config = ['.github/workflows/*.{yml,yaml}', '.github/**/action.{yml,yaml}'];

const isString = (value: unknown): value is string => typeof value === 'string';

const getActionDependencies = (config: any, options: PluginOptions) => {
  const { configFileDir, configFileName } = options;
  const isActionManifest = configFileName === 'action.yml' || configFileName === 'action.yaml';
  if (!(isActionManifest && config?.runs?.using?.startsWith('node'))) return [];
  const runs: Runs = config.runs;
  const scripts = [runs.pre, runs.main, runs.post].filter(isString);
  return scripts.map(script => join(configFileDir, script));
};

const resolveConfig: ResolveConfig = async (config, options) => {
  const { rootCwd, getInputsFromScripts, isProduction } = options;

  const inputs = new Set<Input>();

  const jobs = findByKeyDeep<Job>(config, 'steps');

  for (const steps of jobs) {
    if (!Array.isArray(steps.steps)) continue;
    const action = steps.steps.find(
      step => step.uses?.startsWith('actions/checkout@') && typeof step.with?.path === 'string' && !step.with.repository
    );
    const path = action?.with?.path;
    for (const step of steps.steps) {
      const workingDir = step['working-directory'];
      const dir = join(rootCwd, path && workingDir ? relative(workingDir, path) : workingDir ? workingDir : '.');
      if (step.run) {
        for (const input of getInputsFromScripts([step.run], { knownBinsOnly: true })) {
          if (isDeferResolveEntry(input) && path && !workingDir) {
            input.specifier = relative(join(dir, path), join(rootCwd, input.specifier));
          }
          if (isProduction) Object.assign(input, { optional: true });
          inputs.add({ ...input, dir });
        }
      }
    }
  }

  return [...inputs, ...getActionDependencies(config, options).map(toEntry)];
};

export default {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  config,
  resolveConfig,
} satisfies Plugin;
