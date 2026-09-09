import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';

// https://docs.railway.com/infrastructure-as-code

const title = 'Railway';

const enablers = 'This plugin is enabled when `.railway/railway.ts` is found.';

const isEnabled: IsPluginEnabled = ({ cwd }) => isFile(cwd, '.railway/railway.ts');

const entry = ['.railway/railway.ts'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;
