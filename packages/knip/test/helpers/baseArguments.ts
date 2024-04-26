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
  isDebug: false,
  isWatch: false,
  isFix: false,
  tags: [[], []],
  fixTypes: [],
  isRemoveFiles: false,
} satisfies CommandLineOptions;

export default baseArguments;
