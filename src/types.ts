import { SourceFile } from 'ts-morph';

type SymbolType = 'type' | 'interface' | 'enum';

type UnusedFileIssues = Set<string>;
type UnusedExportIssues = Record<string, Record<string, Issue>>;
type UnresolvedDependencyIssues = Record<string, Record<string, Issue>>;
type UnusedDependencyIssues = Set<string>;

export type Issue = { filePath: string; symbol: string; symbols?: string[]; symbolType?: SymbolType };

export type Issues = {
  files: UnusedFileIssues;
  dependencies: UnusedDependencyIssues;
  devDependencies: UnusedDependencyIssues;
  unresolved: UnresolvedDependencyIssues;
  exports: UnusedExportIssues;
  types: UnusedExportIssues;
  nsExports: UnusedExportIssues;
  nsTypes: UnusedExportIssues;
  duplicates: UnusedExportIssues;
};

type IssueType = keyof Issues;
export type ProjectIssueType = Extract<IssueType, 'files' | 'dependencies' | 'devDependencies'>;
export type SymbolIssueType = Exclude<IssueType, ProjectIssueType>;

// Slightly different issue groups for better(?) UX
export type IssueGroup =
  | 'files'
  | 'dependencies'
  | 'unlisted'
  | 'exports'
  | 'nsExports'
  | 'types'
  | 'nsTypes'
  | 'duplicates';

type BaseLocalConfiguration = {
  entryFiles: string[];
  projectFiles: string[];
};

export type LocalConfiguration = BaseLocalConfiguration & {
  dev?: boolean | BaseLocalConfiguration;
  include?: string[];
  exclude?: string[];
};

export type ImportedConfiguration = LocalConfiguration | Record<string, LocalConfiguration>;

export type UnresolvedConfiguration = {
  cwd: string;
  workingDir: string;
  configFilePath?: string;
  tsConfigFilePath?: string;
  include: string[];
  exclude: string[];
  ignore: string[];
  gitignore: boolean;
  isDev: boolean;
  isShowProgress: boolean;
  jsDoc: string[];
};

export type Report = {
  [key in IssueGroup]: boolean;
};

export type Configuration = {
  workingDir: string;
  report: Report;
  projectFiles: SourceFile[];
  productionFiles: SourceFile[];
  entryFiles: SourceFile[];
  dependencies: string[];
  devDependencies: string[];
  isDev: boolean;
  tsConfigPaths: string[];
  isShowProgress: boolean;
  jsDocOptions: {
    isReadPublicTag: boolean;
  };
};
