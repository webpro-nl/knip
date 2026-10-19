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

export { getWebNextConfig as getSharedNextConfig };
export default getWebNextConfig;

throw new Error('Shared config must not execute during analysis');
