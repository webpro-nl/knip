export interface CommandLineOptions {
  cwd: string;
  tsConfigFile?: string;
  gitignore: boolean;
  isStrict: boolean;
  isProduction: boolean;
  isShowProgress: boolean;
  isIgnoreEntryExports: boolean;
}
