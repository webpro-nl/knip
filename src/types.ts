type FilePath = string;
type SymbolType = 'type' | 'interface' | 'enum';

type UnusedFileIssues = Set<FilePath>;
type UnusedExportIssues = Record<string, Record<string, Issue>>;

export type Issue = { filePath: FilePath; symbol: string; symbols?: string[]; symbolType?: SymbolType };

export type Issues = {
  files: UnusedFileIssues;
  exports: UnusedExportIssues;
  types: UnusedExportIssues;
  nsExports: UnusedExportIssues;
  nsTypes: UnusedExportIssues;
  duplicates: UnusedExportIssues;
};

export type IssueType = keyof Issues;

type LocalConfiguration = {
  entryFiles: string[];
  projectFiles: string[];
};

export type Configuration = LocalConfiguration & {
  cwd: string;
  include: {
    [key in IssueType]: boolean;
  };
  isShowProgress: boolean;
  jsDocOptions: {
    isReadPublicTag: boolean;
  };
};

export type ImportedConfiguration = LocalConfiguration | Record<string, LocalConfiguration>;
