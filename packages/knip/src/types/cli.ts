export interface CommandLineOptions {
  cwd: string;
  tsConfigFile?: string;
  gitignore: boolean;
  isStrict: boolean;
  isProduction: boolean;
  isShowProgress: boolean;
  isIncludeEntryExports: boolean;
  isIncludeLibs: boolean;
  isIsolateWorkspaces: boolean;
  tags: Tags;
  isFix: boolean;
  fixTypes: string[];
}

export type Tags = [string[], string[]];
