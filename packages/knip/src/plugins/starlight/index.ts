import type ts from 'typescript';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { config } from '../astro/index.js';
import { getInputsFromSourceFile } from './resolveFromAST.js';

// https://starlight.astro.build/reference/configuration/

const title = 'Starlight';

const enablers = ['@astrojs/starlight'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const resolveFromAST: ResolveFromAST = (sourceFile: ts.SourceFile) => {
  const inputs = getInputsFromSourceFile(sourceFile);

  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
