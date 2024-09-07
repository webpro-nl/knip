import type { CommandLineOptions } from '../../src/types/cli.js';
import { join } from '../../src/util/path.js';

const cwd = process.cwd();
const cacheLocation = join(cwd, 'node_modules', '.cache', 'knip');

const baseArguments = {
  cacheLocation,
  cwd,
  excludedIssueTypes: [],
  fixTypes: [],
  gitignore: true,
  includedIssueTypes: [],
  isCache: false,
  isDebug: false,
  isDependenciesShorthand: false,
  isExportsShorthand: false,
  isFilesShorthand: false,
  isFix: false,
  isHideConfigHints: false,
  isIncludeEntryExports: false,
  isIncludeLibs: false,
  isIsolateWorkspaces: false,
  isProduction: false,
  isRemoveFiles: false,
  isShowProgress: false,
  isStrict: false,
  isWatch: false,
  tags: [[], []],
  tsConfigFile: undefined,
  workspace: undefined,
} satisfies CommandLineOptions;

export default baseArguments;
