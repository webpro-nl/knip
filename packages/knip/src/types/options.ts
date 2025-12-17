export interface Options {
  cacheLocation: string;
  cwd: string;
  excludedIssueTypes: string[];
  fixTypes: string[];
  gitignore: boolean;
  includedIssueTypes: string[];
  isCache: boolean;
  isDebug: boolean;
  isDependenciesShorthand: boolean;
  isExportsShorthand: boolean;
  isFilesShorthand: boolean;
  isFix: boolean;
  isFormat: boolean;
  isIncludeEntryExports: boolean;
  isIncludeLibs: boolean;
  isIsolateWorkspaces: boolean;
  isProduction: boolean;
  isRemoveFiles: boolean;
  isSession: boolean;
  isShowProgress: boolean;
  isStrict: boolean;
  isUseTscFiles: boolean;
  isWatch: boolean;
  tags: string[];
  tsConfigFile: string | undefined;
  workspace: string | undefined;
}

export type Tags = [string[], string[]];
