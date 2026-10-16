import { getRuleOptions } from './index.ts';

export function getBaseNextConfig() {
  return { turbopack: { rules: { '*.css': { loaders: ['@tailwindcss/turbopack'], ...getRuleOptions() } } } };
}
