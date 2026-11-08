import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDeferResolveEntry } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { PM2Application, PM2Config } from './types.ts';

const title = 'pm2';

const enablers = ['pm2'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['pm2.config.{json,js,cjs,mjs}', 'ecosystem.config.{json,js,cjs,mjs}'];

const addApplicationEntry = (application: PM2Application, entries: Input[], cwd: string) => {
  if (application.script && isInternal(application.script))
    entries.push(toDeferResolveEntry(application.script, { dir: cwd }));
};

const resolveConfig: ResolveConfig<PM2Config> = (config, { cwd }) => {
  const entries: Input[] = [];

  if (Array.isArray(config)) {
    for (const application of config) addApplicationEntry(application, entries, cwd);
    return entries;
  }

  addApplicationEntry(config, entries, cwd);

  if (!config.apps) return entries;

  const applications = Array.isArray(config.apps) ? config.apps : [config.apps];
  for (const application of applications) addApplicationEntry(application, entries, cwd);

  return entries;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
