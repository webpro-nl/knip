import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { findCallArg, getDefaultImportName, getImportMap, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { toDependency, toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { config } from '../astro/index.ts';
import { getCalleeImportSources, getComponentPathsFromSourceFile } from './resolveFromAST.ts';

// https://starlight.astro.build/reference/configuration/

const title = 'Starlight';

const enablers = ['@astrojs/starlight'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const resolveFromAST: ResolveFromAST = program => {
  const componentPaths = getComponentPathsFromSourceFile(program);
  const inputs = Array.from(componentPaths).map(id => toProductionEntry(id));

  const importMap = getImportMap(program);
  const starlightImportName = getDefaultImportName(importMap, '@astrojs/starlight');

  if (starlightImportName) {
    const starlightConfig = findCallArg(program, starlightImportName);
    if (starlightConfig) {
      const customCssPaths = getPropertyValues(starlightConfig, 'customCss');
      for (const id of customCssPaths) {
        inputs.push(toProductionEntry(id));
      }

      const pluginSources = getCalleeImportSources(starlightConfig, 'plugins', importMap);
      for (const source of pluginSources) {
        inputs.push(toDependency(source));
      }
    }
  }

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
