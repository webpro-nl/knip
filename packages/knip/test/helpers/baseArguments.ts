import type { CommandLineOptions } from '../../src/types/cli.js';

const baseArguments = {
  cwd: '.',
  gitignore: true,
  isStrict: false,
  isProduction: false,
  isShowProgress: false,
  isIncludeEntryExports: false,
  isIncludeLibs: false,
  isIsolateWorkspaces: false,
  isFix: false,
  tags: [[], []],
  fixTypes: [],
} satisfies CommandLineOptions;

export default baseArguments;
