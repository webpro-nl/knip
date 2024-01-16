import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { getArgumentValues } from './helpers.js';
import type { MarkdownlintConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/igorshubovych/markdownlint-cli

const NAME = 'markdownlint';

const ENABLERS = ['markdownlint-cli'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['.markdownlint.{json,jsonc}', '.markdownlint.{yml,yaml}'];

const findMarkdownlintConfigDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: MarkdownlintConfig | undefined = await load(configFilePath);

  const extend = localConfig?.extends ? [localConfig.extends] : [];
  const scripts = manifest?.scripts
    ? Object.values(manifest.scripts).filter((script): script is string => typeof script === 'string')
    : [];
  const uses = scripts
    .filter(script => script.includes('markdownlint '))
    .flatMap(script => getArgumentValues(script, / (--rules|-r)[ =]([^ ]+)/g));
  return [...extend, ...uses];
};

const findDependencies = timerify(findMarkdownlintConfigDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
