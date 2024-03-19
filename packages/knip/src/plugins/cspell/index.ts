import { hasDependency } from '#p/util/plugin.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { CSpellConfig } from './types.js';

// https://cspell.org/configuration/

const title = 'CSpell';

const enablers = ['cspell'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  'cspell.config.{js,cjs,json,yaml,yml}',
  'cspell.{json,yaml,yml}',
  '.c{s,S}pell.json',
  'c{s,S}pell.json',
];

const resolveConfig: ResolveConfig<CSpellConfig> = config => {
  return config.import ?? [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} as const;
