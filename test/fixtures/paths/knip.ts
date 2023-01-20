import type { KnipConfig } from '../../../src';

const config: KnipConfig = {
  paths: {
    '~/*': ['./*'],
    '@lib': ['./lib/index.ts'],
    '@lib/*': ['./lib/*'],
    'xyz/*': ['abc/*'],
  },
};

export default config;
