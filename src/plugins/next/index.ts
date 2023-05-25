import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { getWebpackDependencies } from '../webpack/index.js';
import type { NextConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts
// https://nextjs.org/docs/pages/api-reference/next-config-js/webpack

export const NAME = 'Next.js';

/** @public */
export const ENABLERS = ['next'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['next.config.{js,ts}'];

export const PRODUCTION_ENTRY_FILE_PATTERNS = ['pages/**/*.{js,jsx,ts,tsx}', 'src/pages/**/*.{js,jsx,ts,tsx}'];

const findNextDependencies: GenericPluginCallback = async (configFilePath, { isProduction }) => {
  const config: NextConfig = await load(configFilePath);
  if (!config || typeof config.webpack !== 'function') return [];

  const preConfig = { module: { rules: [] } };
  const buildId = '1';
  const defaultLoaders = { babel: {} };
  const nextRuntime = undefined;

  const envPasses = isProduction === true ? [true] : [false, true];
  const isServerPasses = [false, true];

  return envPasses.flatMap(dev =>
    isServerPasses.flatMap(isServer => {
      const webpackConfig = config.webpack(preConfig, { buildId, dev, isServer, defaultLoaders, nextRuntime });
      return getWebpackDependencies(webpackConfig, isProduction);
    })
  );
};

export const findDependencies = timerify(findNextDependencies);
