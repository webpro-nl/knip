import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';

// https://vercel.com/docs/project-configuration

const title = 'Vercel';

const enablers = 'This plugin is enabled when a Vercel project configuration file is found in the root folder.';

const entry = ['vercel.{json,js,mjs,cjs,ts,mts}'];

const configFiles = ['vercel.json', 'vercel.js', 'vercel.mjs', 'vercel.cjs', 'vercel.ts', 'vercel.mts'];

const isEnabled: IsPluginEnabled = ({ cwd }) => configFiles.some(file => isFile(cwd, file));

const isRootOnly = true;

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  isRootOnly,
};

export default plugin;
