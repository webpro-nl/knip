import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  workspaces: {
    '.': {
      ignoreBinaries: ['knip']
    },
    'packages/knip': {
      entry: ['src/{index,cli}.ts!', 'src/plugins/*/index.ts!'],
      project: ['src/**/*.ts!'],
      ignore: ['**/fixtures/**', '**/_template/**', '**/dist/**'],
      ignoreDependencies: ['@pnpm/logger'],
      'node-test-runner': {
        entry: ['test/**/*.test.ts'],
        project: ['test/**/*.ts']
      }
    },
    'packages/docs': {
      entry: ['{remark,scripts}/*.ts', 'src/components/{Head,Footer}.astro!'],
      ignore: 'config.ts',
      ignoreBinaries: ['rg']
    }
  },
  compilers: {
    astro: (text: string) => [...text.replace(/```[\s\S]*?```/g, '').matchAll(/import\s[^;]+;/g)].join('\n'),
    mdx: (text: string) => [...text.replace(/```[\s\S]*?```/g, '').matchAll(/import\s[^;]+;/g)].join('\n')
  }
};

export default config;
