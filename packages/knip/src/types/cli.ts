export interface CommandLineOptions {
  cwd: string;
  tsConfigFile?: string;
  gitignore: boolean;
  isStrict: boolean;
  isProduction: boolean;
  isShowProgress: boolean;
  isIncludeEntryExports: boolean;
  isIsolateWorkspaces: boolean;
  tags: [string[], string[]];
  isFix: boolean;
  fixTypes: string[];
}
