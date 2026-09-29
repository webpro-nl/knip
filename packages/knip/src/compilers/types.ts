type FileExtension = string;

export type CompilerSync = (source: string, path: string) => string;
export type CompilerResult = string | PromiseLike<string>;
export type Compiler = (source: string, path: string) => CompilerResult;

export type RawCompilers = Map<FileExtension, Compiler | true>;
export type Compilers = Map<FileExtension, Compiler>;

export type HasDependency = (pkgName: string) => boolean;
