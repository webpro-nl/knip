import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';

export const config: Config = {
  namespace: 'MyApp',
  globalScript: 'src/global.ts',
  globalStyle: 'src/global-1.scss',
  outputTargets: [{type: 'global-style', input: 'src/global-2.scss'}],
  testing: {
    setupFilesAfterEnv: ['./setup-jest.ts'],
  },
  plugins: [
    sass()
  ],
};
