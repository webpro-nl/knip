import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { getInputsFromHandlers } from './resolveFromAST.js';

// https://v2.sst.dev
// https://sst.dev/docs/

const title = 'SST';

const enablers = ['sst'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['sst.config.ts'];

const resolveFromAST: ResolveFromAST = (sourceFile, options) => {
  const inputs = getInputsFromHandlers(sourceFile, options);
  return inputs;
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
} satisfies Plugin;
