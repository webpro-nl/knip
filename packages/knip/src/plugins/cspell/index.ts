import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { CSpellConfig } from './types.ts';

// https://cspell.org/configuration/
// https://github.com/streetsidesoftware/cspell/blob/41e78789bedc10433f858031e267ff861c81dd1a/packages/cspell-lib/src/lib/Settings/Controller/configLoader/configLocations.ts

const title = 'CSpell';

const enablers = ['cspell'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  'package.json',
  'cspell.config.{js,cjs,mjs,ts,mts,json,yaml,yml}',
  'cspell.{json,yaml,yml}',
  '.c{s,S}pell.json',
  'c{s,S}pell.json',
];

const resolveConfig: ResolveConfig<CSpellConfig> = config => {
  return [config?.import ?? []].flat().map(id => toDeferResolve(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
