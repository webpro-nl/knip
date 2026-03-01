import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { Input } from '../../util/input.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { WxtConfig } from './types.ts';

// https://wxt.dev/guide/configuration.html

const title = 'WXT';

const enablers = ['wxt'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['wxt.config.{js,mjs,ts}'];

const entry = ['entrypoints/**/*.{ts,tsx,js,jsx,html}'];

const production = ['entrypoints/**/*.{ts,tsx,js,jsx,html}'];

const setup = async () => {
  if (globalThis && !('defineConfig' in globalThis)) {
    Object.defineProperty(globalThis, 'defineConfig', {
      value: (id: any) => id,
      writable: true,
      configurable: true,
    });
  }
};

const resolveConfig: ResolveConfig<WxtConfig> = async localConfig => {
  const deps =
    localConfig?.modules?.reduce<Input[]>((acc, id) => {
      if (typeof id === 'string') acc.push(toDependency(id));
      return acc;
    }, []) ?? [];

  return deps;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  setup,
  resolveConfig,
};

export default plugin;
