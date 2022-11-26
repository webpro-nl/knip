import load from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://mochajs.org/#configuring-mocha-nodejs

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => {
  return dependencies.has('mocha');
};

export const CONFIG_FILE_PATTERNS = ['.mocharc.{js,cjs}', '.mocharc.{json,jsonc}', 'package.json'];

// .mocharc.yaml, .mocharc.yml
export const ENTRY_FILE_PATTERNS = ['test/**/*.{js,cjs,mjs}'];

const findMochaDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config = configFilePath.endsWith('package.json') ? manifest.mocha : await load(configFilePath);
  if (config) {
    const require = config.require;
    return require ? [require].map(getPackageName) : [];
  }
  return [];
};

export const findDependencies = timerify(findMochaDependencies);
