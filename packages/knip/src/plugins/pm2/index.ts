import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { isFile } from '../../util/fs.js';
import { toEntry } from '../../util/input.js';
import { isInternal } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { PM2Application, PM2Config } from './types.js';

const title = 'pm2';

const enablers = ['pm2'];

const configFileNames = [
  'pm2.config.json',
  'pm2.config.js',
  'pm2.config.cjs',
  'pm2.config.mjs',
  'ecosystem.config.json',
  'ecosystem.config.js',
  'ecosystem.config.cjs',
  'ecosystem.config.mjs',
];

const isEnabled: IsPluginEnabled = ({ cwd, dependencies }) =>
  hasDependency(dependencies, enablers) || configFileNames.some(name => isFile(cwd, name));

const config = ['pm2.config.{json,js,cjs,mjs}', 'ecosystem.config.{json,js,cjs,mjs}'];

const addApplicationEntry = (application: PM2Application, entries: ReturnType<typeof toEntry>[]) => {
  if (application.script && isInternal(application.script)) entries.push(toEntry(application.script));
};

const resolveConfig: ResolveConfig<PM2Config> = config => {
  const entries: ReturnType<typeof toEntry>[] = [];

  if (Array.isArray(config)) {
    for (const application of config) addApplicationEntry(application, entries);
    return entries;
  }

  addApplicationEntry(config, entries);

  if (!config.apps) return entries;

  const applications = Array.isArray(config.apps) ? config.apps : [config.apps];
  for (const application of applications) addApplicationEntry(application, entries);

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
