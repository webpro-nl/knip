import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'MyApp',
  globalScript: 'src/global.ts',
  testing: {
    setupFilesAfterEnv: ['./setup-jest.ts'],
  },
};
