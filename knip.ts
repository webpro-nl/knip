import type { KnipConfig } from './packages/knip/src/types.ts';

const config: KnipConfig = {
  workspaces: {
    '.': {
      project: ['!templates'],
      ignoreBinaries: ['tsc'],
    },
    'packages/knip': {
      entry: ['test/**/*.ts'],
      project: ['src/**/*.ts!', '!src/util/empty.ts', '!**/_template'],
      ignoreDependencies: ['prettier'],
    },
    'packages/docs': {
      entry: ['{remark,scripts}/*.ts'],
    },
    'packages/vscode-knip': {
      entry: ['src/index.js!', 'scripts/*.js', 'test/*.mjs'],
      ignoreBinaries: ['vsce', 'ovsx'],
    },
  },
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};

export default config;
