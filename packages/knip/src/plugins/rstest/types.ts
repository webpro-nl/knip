import type { ConfigParams } from '../rsbuild/types.ts';

type TestEnvironment = 'node' | 'jsdom' | 'happy-dom';

export type RstestProjectConfig = {
  // https://rstest.rs/config/test/root
  root?: string;
  // https://rstest.rs/config/test/include
  include?: string[];
  // https://rstest.rs/config/test/exclude
  exclude?: string[] | { patterns: string[] };
  // https://rstest.rs/config/test/test-environment
  testEnvironment?: TestEnvironment | { name: TestEnvironment };
  // https://rstest.rs/config/test/setup-files
  setupFiles?: string | string[];
  // https://rstest.rs/config/test/global-setup
  globalSetup?: string | string[];
  // https://rstest.rs/config/test/browser
  browser?: { enabled?: boolean };
  // https://rstest.rs/config/build/resolve
  resolve?: { alias?: Record<string, string | false | (string | false)[]> };
};

type RstestConfig = RstestProjectConfig & {
  // https://rstest.rs/config/test/projects
  projects?: (string | RstestProjectConfig)[];
  // https://rstest.rs/config/test/coverage
  coverage?: { provider?: 'istanbul' | 'v8' };
};

export type RstestConfigOrFn = RstestConfig | ((params: ConfigParams) => RstestConfig | Promise<RstestConfig>);
