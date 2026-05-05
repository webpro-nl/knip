import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';

// https://vercel.com/docs/project-configuration

const title = 'Vercel';

const enablers = 'This plugin is enabled when a Vercel project configuration file is found in the root folder.';

const config = ['vercel.{json,js,mjs,cjs,ts,mts}'];

const configFiles = ['vercel.json', 'vercel.js', 'vercel.mjs', 'vercel.cjs', 'vercel.ts', 'vercel.mts'];

const isEnabled: IsPluginEnabled = ({ cwd }) => configFiles.some(file => isFile(cwd, file));

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
};

export default plugin;
