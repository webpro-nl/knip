import type ts from 'typescript';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { config } from '../astro/index.ts';
import { getComponentPathsFromSourceFile } from './resolveFromAST.ts';

// https://starlight.astro.build/reference/configuration/

const title = 'Starlight';

const enablers = ['@astrojs/starlight'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const resolveFromAST: ResolveFromAST = (sourceFile: ts.SourceFile) => {
  const componentPaths = getComponentPathsFromSourceFile(sourceFile);
  return Array.from(componentPaths).map(id => toProductionEntry(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
