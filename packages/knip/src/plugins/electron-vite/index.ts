import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { isAbsolute, join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getHtmlScriptEntries } from '../vite/helpers.ts';
import type { ElectronViteConfig } from './types.ts';

// https://electron-vite.org/config/

const title = 'electron-vite';

const enablers = ['electron-vite'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['electron.vite.config.{js,mjs,cjs,ts,mts,cts}'];

const defaultEntry = {
  main: 'src/main/index.{js,mjs,cjs,ts,mts,cts}',
  preload: 'src/preload/index.{js,mjs,cjs,ts,mts,cts}',
  renderer: 'src/renderer/index.html',
};

const production = Object.values(defaultEntry);

const buildEnv = { command: 'build', mode: 'production' };

const resolveConfig: ResolveConfig<ElectronViteConfig> = async (localConfig, options) => {
  const { configFileDir } = options;
  const config = typeof localConfig === 'function' ? await localConfig(buildEnv) : localConfig;

  const inputs: Input[] = [];

  for (const name of ['main', 'preload', 'renderer'] as const) {
    let section = config?.[name];
    if (typeof section === 'function') section = await section(buildEnv);

    const ids: string[] = [];
    for (const input of [section?.build?.rollupOptions?.input, section?.build?.lib?.entry]) {
      if (typeof input === 'string') ids.push(input);
      else if (input) ids.push(...Object.values(input as Record<string, string>));
    }

    const patterns = ids.length > 0 ? ids : [defaultEntry[name]];
    for (const id of patterns) {
      const resolved = isAbsolute(id) ? id : join(configFileDir, id);
      inputs.push(toProductionEntry(resolved));
      if (name === 'renderer' && resolved.endsWith('.html')) {
        for (const input of await getHtmlScriptEntries(resolved)) inputs.push(input);
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
  production,
  resolveConfig,
};

export default plugin;
