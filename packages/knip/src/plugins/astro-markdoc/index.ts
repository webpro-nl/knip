import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { MarkdocConfig, MarkdocRenderSpecifier } from './types.ts';

// https://docs.astro.build/en/guides/integrations-guide/markdoc

const title = 'Astro Markdoc';

const enablers = ['@astrojs/markdoc'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['markdoc.config.{js,ts,mjs,mts}'];

const extractSpecifiers = (renderField: MarkdocRenderSpecifier | undefined): string[] => {
  if (typeof renderField === 'string') {
    return [renderField.split('#')[0]];
  }

  if (renderField && typeof renderField === 'object') {
    for (const key of ['Component', 'file', 'path']) {
      if (typeof renderField[key] === 'string') {
        return [(renderField[key] as string).split('#')[0]];
      }
    }
  }

  return [];
};

const resolveConfig: ResolveConfig<MarkdocConfig> = async localConfig => {
  if (!localConfig) return [];

  const entries = [...Object.values(localConfig.nodes ?? {}), ...Object.values(localConfig.tags ?? {})];

  const specifiers = entries.flatMap(item =>
    item && typeof item === 'object' && 'render' in item ? extractSpecifiers(item.render as MarkdocRenderSpecifier) : []
  );

  return specifiers.map(id => toProductionEntry(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
