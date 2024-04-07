import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  include: ['classMembers'],
  ignore: ['templates/**'],
  workspaces: {
    '.': {
      ignoreBinaries: ['knip'],
    },
    'packages/knip': {
      entry: ['src/{index,cli}.ts!', 'src/plugins/*/index.ts!'],
      project: ['src/**/*.ts!'],
      ignore: ['**/fixtures/**', '**/_template/**', '**/dist/**'],
      ignoreDependencies: ['@pnpm/logger'],
      'node-test-runner': {
        entry: ['test/**/*.test.ts'],
        project: ['test/**/*.ts'],
      },
    },
    'packages/docs': {
      entry: ['{remark,scripts}/*.ts', 'src/components/{Head,Header,Footer}.astro!'],
      ignore: 'config.ts',
    },
  },
};

export default config;
