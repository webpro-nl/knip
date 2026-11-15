import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isDeferResolveEntry, toEntryPath, toProject } from '../../util/input.ts';
import { join, relative } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getActionDependencies, resolveConfig as resolveStepsConfig } from '../github-actions/index.ts';

// https://docs.github.com/en/actions/sharing-automations/creating-actions/metadata-syntax-for-github-actions

const title = 'GitHub Action';

const enablers = ['@actions/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['action.{yml,yaml}'];

const isAssumeArtifact = (specifier: string) => /^(dist|build)\//.test(specifier);

const resolveConfig: ResolveConfig = async (config, options) => {
  const inputs = [];
  if (config?.runs?.using === 'composite') {
    for (const input of await resolveStepsConfig(config, options)) {
      const relativePath = relative(options.cwd, join(input.dir ?? options.cwd, input.specifier));
      if (isDeferResolveEntry(input) && isAssumeArtifact(relativePath)) inputs.push(toProject(`!${relativePath}`));
      else inputs.push(input);
    }
    return inputs;
  }
  const filePaths = getActionDependencies(config, options);
  for (const filePath of new Set(filePaths)) {
    const relativePath = relative(options.cwd, filePath);
    if (isAssumeArtifact(relativePath)) inputs.push(toProject(`!${relativePath}`));
    else inputs.push(toEntryPath(filePath));
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
