import type { PackageJson } from 'type-fest';

type Options = { cwd?: string; manifest?: PackageJson; ignore?: string[]; knownGlobalsOnly?: boolean };

export type GetBinariesFromScripts = (
  npmScripts: string | string[],
  options?: Options
) => { entryFiles: string[]; binaries: string[] };

type FromArgs = (args: string[]) => string[];

export type Resolver = (
  binary: string,
  args: string[],
  options: { cwd: string; manifest: PackageJson; fromArgs: FromArgs }
) => string[];
