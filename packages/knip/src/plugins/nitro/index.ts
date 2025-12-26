import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import type { Input } from '../../util/input.js';
import { toDependency, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { NitroConfig } from './types.js';

const title = 'Nitro';

const enablers = ['nitropack'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['nitro.config.{js,mjs,ts}'];

const production = ['api/**/*.ts', 'routes/**/*.ts', 'middleware/**/*.ts', 'plugins/**/*.ts', '.nitro/types/*.d.ts'];

const setup = async () => {
  if (globalThis && !('defineNitroConfig' in globalThis)) {
    Object.defineProperty(globalThis, 'defineNitroConfig', {
      value: (id: any) => id,
      writable: true,
      configurable: true,
    });
  }
};

const resolveConfig: ResolveConfig<NitroConfig> = async localConfig => {
  const srcDir = localConfig.srcDir ?? '.';

  const patterns = [
    toProductionEntry('.nitro/types/*.d.ts'),
    ...[
      join(typeof localConfig.apiDir === 'string' ? localConfig.apiDir : 'api', '**/*.ts'),
      join(typeof localConfig.routesDir === 'string' ? localConfig.routesDir : 'routes', '**/*.ts'),
      'middleware/**/*.ts',
      'plugins/**/*.ts',
    ].map(pattern => toProductionEntry(join(srcDir, pattern)))
  ];

  const deps =
    localConfig.modules?.reduce<Input[]>((acc, id) => {
      if (Array.isArray(id) && typeof id[0] === 'string') acc.push(toDependency(id[0]));
      if (typeof id === 'string') acc.push(toDependency(id));
      return acc;
    }, []) ?? [];

  return [...deps, ...patterns];
};

const note = `Knip works best with [manual imports](https://nitro.build/guide/utils#manual-imports).
Nitro allows you to disable auto-imports by setting \`imports: false\` in your Nitro config.`;

/** @public */
export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  setup,
  resolveConfig,
};

export default plugin;
