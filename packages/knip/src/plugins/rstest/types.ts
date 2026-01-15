export type RstestConfig = {
  // https://rstest.rs/config/test/include#include
  include?: string[];
  // https://rstest.rs/config/test/exclude#exclude
  exclude?: string[];
  // https://rstest.rs/config/test/testenvironment#testenvironment
  testEnvironment?: 'node' | 'jsdom' | 'happy-dom';
  // https://rstest.rs/config/test/setupFiles#setupfiles
  setupFiles?: string[];
};
