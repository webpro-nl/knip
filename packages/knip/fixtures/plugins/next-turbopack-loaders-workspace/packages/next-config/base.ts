import { getRuleOptions } from './index.ts';

export function getBaseNextConfig() {
  return {
    turbopack: {
      resolveAlias: { underscore: 'lodash-es' },
      rules: {
        '*.css': { loaders: ['@tailwindcss/turbopack'], ...getRuleOptions() },
        '*.md': { loaders: ['@shared/md-loader'], as: '*.js' },
      },
    },
  };
}

export const unusedBaseOption = true;
