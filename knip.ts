import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  workspaces: {
    'packages/knip': {
      entry: ['src/{index,cli}.ts!'],
      project: ['src/**/*.ts!'],
      ignore: ['**/fixtures/**', '**/_template/**', '**/dist/**'],
      ignoreDependencies: ['@pnpm/logger'],
      'node-test-runner': {
        entry: ['test/**/*.test.ts'],
        project: ['test/**/*.ts']
      }
    },
    'packages/knip.dev': {
      entry: ['scripts/*.ts'],
      ignoreBinaries: ['rg']
    }
  },
  compilers: {
    mdx: (text: string) => [...text.replace(/```[\s\S]*?```/g, '').matchAll(/import\s[^;]+;/g)].join('\n')
  }
};

export default config;
