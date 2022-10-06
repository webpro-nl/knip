type LocalConfiguration = {
  entryFiles: string[];
  filePatterns: string[];
};

export type Configuration = LocalConfiguration & {
  cwd: string;
  isOnlyFiles: boolean;
  isOnlyExports: boolean;
  isOnlyTypes: boolean;
  isOnlyDuplicates: boolean;
  isOnlyNsMembers: boolean;
  isFindUnusedFiles: boolean;
  isFindUnusedExports: boolean;
  isFindUnusedTypes: boolean;
  isFindDuplicateExports: boolean;
  isFindNsImports: boolean;
  isShowProgress: boolean;
  jsDocOptions: {
    isReadPublicTag: boolean;
  };
};

export type ImportedConfiguration = LocalConfiguration | Record<string, LocalConfiguration>;

type FilePath = string;
export type SymbolType = 'type' | 'interface' | 'enum';

type UnusedFileIssues = Set<FilePath>;
type UnusedExportIssues = Record<string, Record<string, Issue>>;

export type Issue = { filePath: FilePath; symbol: string; symbols?: string[]; symbolType?: SymbolType };

export type Issues = {
  file: UnusedFileIssues;
  export: UnusedExportIssues;
  type: UnusedExportIssues;
  duplicate: UnusedExportIssues;
  member: UnusedExportIssues;
};
