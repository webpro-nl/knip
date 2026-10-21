import { getBaseNextConfig } from './base.ts';

const webConfig = getBaseNextConfig();

function getWebNextConfig() {
  return getWebConfig();
}

function getWebConfig() {
  return webConfig;
}

export function getRuleOptions() {
  return { as: '*.css' };
}

const adminRules = { turbopack: { rules: { '*.svg': { loaders: ['admin-loader'] } } } };
const adminConfig = { ...adminRules };

export const getAdminNextConfig = () => adminConfig;

export function getUnusedNextConfig() {
  return {
    turbopack: {
      resolveAlias: { 'legacy-polyfill': './polyfills/legacy.ts' },
      rules: { '*.txt': { loaders: ['./loaders/raw.cjs'] } },
    },
  };
}

export { getWebNextConfig as getSharedNextConfig };
export default getWebNextConfig;

