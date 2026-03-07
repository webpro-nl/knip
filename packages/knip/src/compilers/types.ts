type FileExtension = string;

export type CompilerSync = (source: string, path: string) => string;
export type CompilerAsync = (source: string, path: string) => Promise<string>;

export type RawSyncCompilers = Map<FileExtension, CompilerSync | true>;
export type SyncCompilers = Map<FileExtension, CompilerSync>;
export type AsyncCompilers = Map<FileExtension, CompilerAsync>;
export type Compilers = [SyncCompilers, AsyncCompilers];

export type HasDependency = (pkgName: string) => boolean;
