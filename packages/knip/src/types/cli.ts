export interface CommandLineOptions {
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
  isHideConfigHints: boolean;
  isIncludeEntryExports: boolean;
  isIncludeLibs: boolean;
  isIsolateWorkspaces: boolean;
  isProduction: boolean;
  isRemoveFiles: boolean;
  isShowProgress: boolean;
  isStrict: boolean;
  isWatch: boolean;
  tags: Tags;
  tsConfigFile: string | undefined;
  workspace: string | undefined;
}

export type Tags = [string[], string[]];
