import { _load } from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { timerify } from '../../util/performance.js';
import { hasDependency, getArgumentValues } from '../../util/plugin.js';
import type { MarkdownlintConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/igorshubovych/markdownlint-cli

export const NAME = 'markdownlint';

/** @public */
export const ENABLERS = ['markdownlint-cli'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.markdownlint.{json,jsonc}', '.markdownlint.{yml,yaml}'];

const findMarkdownlintConfigDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config: MarkdownlintConfig = await _load(configFilePath);
  const extend = config?.extends ? [getPackageName(config.extends)] : [];
  const scripts = manifest.scripts
    ? Object.values(manifest.scripts).filter((script): script is string => typeof script === 'string')
    : [];
  const uses = scripts
    .filter(script => script.includes('markdownlint '))
    .flatMap(script => getArgumentValues(script, / (--rules|-r)[ =]([^ ]+)/g));
  return [...extend, ...uses];
};

export const findDependencies = timerify(findMarkdownlintConfigDependencies);
