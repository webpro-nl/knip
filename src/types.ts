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

export type IssueType = keyof Issues;
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

export type BaseLocalConfiguration = {
  entryFiles: string[];
  projectFiles: string[];
};

export type LocalConfiguration = BaseLocalConfiguration & {
  dev?: boolean | BaseLocalConfiguration;
  entryFiles: string[];
  projectFiles: string[];
  include?: string[];
  exclude?: string[];
};

export type ImportedConfiguration = LocalConfiguration | Record<string, LocalConfiguration>;

export type Configuration = LocalConfiguration & {
  workingDir: string;
  report: {
    [key in IssueGroup]: boolean;
  };
  dependencies: string[];
  devDependencies: string[];
  isDev: boolean;
  tsConfigPaths: string[];
  isShowProgress: boolean;
  jsDocOptions: {
    isReadPublicTag: boolean;
  };
};
