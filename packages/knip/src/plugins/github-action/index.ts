import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toEntry, toProject } from '../../util/input.js';
import { relative } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getActionDependencies } from '../github-actions/index.js';

// https://docs.github.com/en/actions/sharing-automations/creating-actions/metadata-syntax-for-github-actions

const title = 'GitHub Action';

const enablers = ['@actions/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['action.{yml,yaml}'];

const isAssumeArtifact = (specifier: string) => /^(dist|build)\//.test(specifier);

const resolveConfig: ResolveConfig = async (config, options) => {
  const inputs = [];
  const filePaths = getActionDependencies(config, options);
  for (const filePath of new Set(filePaths)) {
    const relativePath = relative(options.cwd, filePath);
    if (isAssumeArtifact(relativePath)) inputs.push(toProject(`!${relativePath}`));
    else inputs.push(toEntry(relativePath));
  }
  return inputs;
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
