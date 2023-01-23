import { getBinariesFromScripts } from '../../util/binaries/index.js';
import { _firstGlob } from '../../util/glob.js';
import { _load } from '../../util/loader.js';
import { getValuesByKeyDeep } from '../../util/object.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions

export const NAME = 'GitHub Actions';

/** @public */
export const ENABLERS = 'This plugin is enabled when a `.yml` file is found in the `.github/workflows` folder.';

export const isEnabled: IsPluginEnabledCallback = async ({ cwd }) =>
  Boolean(await _firstGlob({ cwd, patterns: ['.github/workflows/*.yml'] }));

export const CONFIG_FILE_PATTERNS = ['.github/workflows/*.yml', '.github/**/action.{yml,yaml}'];

const findGithubActionsDependencies: GenericPluginCallback = async (configFilePath, { manifest, rootConfig }) => {
  const config = await _load(configFilePath);

  if (!config) return [];

  const scripts = getValuesByKeyDeep(config, 'run').filter((value): value is string => typeof value === 'string');

  const binaries = getBinariesFromScripts(scripts, {
    manifest,
    ignore: rootConfig.ignoreBinaries,
    knownGlobalsOnly: true,
  });

  return binaries;
};

export const findDependencies = timerify(findGithubActionsDependencies);
