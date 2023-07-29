import type { IssueType } from './types/issues.js';

export const ROOT_WORKSPACE_NAME = '.';

export const KNIP_CONFIG_LOCATIONS = ['knip.json', 'knip.jsonc', '.knip.json', '.knip.jsonc', 'knip.ts', 'knip.js'];

// TS extensions: https://github.com/microsoft/TypeScript/blob/da8dfbf0ff6a94df65568fd048aec0d763c65811/src/compiler/types.ts#L7637-L7651
export const DEFAULT_EXTENSIONS = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.mts', '.cts'];

// This is ignored in --production mode (apart from what plugins would add)
export const TEST_FILE_PATTERNS = [
  '**/*{.,-}{test,spec}.{js,jsx,ts,tsx,mjs,cjs}',
  '**/{test,__tests__}/**/*.{js,jsx,ts,tsx,mjs,cjs}',
];

export const GLOBAL_IGNORE_PATTERNS = ['**/node_modules/**', '.yarn'];

// Binaries that are expected to be globally installed (i.e. https://www.npmjs.com/package/[name] is NOT the expected dependency)
// Package may exist in npm registry, but last publish is at least 6 years ago.
export const IGNORED_GLOBAL_BINARIES = [
  'bash',
  'bun',
  'cat',
  'cd',
  'cp',
  'deno',
  'dirname',
  'echo',
  'exec',
  'exit',
  'git',
  'grep',
  'mkdir',
  'mv',
  'node',
  'npm',
  'npx',
  'pnpm',
  'pnpx',
  'rm',
  'sh',
  'sudo',
  'test', // exception
  'true',
  'yarn',
];

export const IGNORED_DEPENDENCIES = ['knip', 'typescript'];

export const IGNORED_FILE_EXTENSIONS = [
  '.avif',
  '.css',
  '.eot',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.less',
  '.png',
  '.sass',
  '.scss',
  '.svg',
  '.ttf',
  '.webp',
  '.woff',
  '.woff2',
  '.yaml',
  '.yml',
];

// The `@types/node` dependency does not require the `node` dependency
export const IGNORE_DEFINITELY_TYPED = ['node'];

export const ISSUE_TYPES: IssueType[] = [
  'files',
  'dependencies',
  'devDependencies',
  'unlisted',
  'binaries',
  'unresolved',
  'exports',
  'nsExports',
  'types',
  'nsTypes',
  'enumMembers',
  'classMembers',
  'duplicates',
];

export const ISSUE_TYPE_TITLE: Record<IssueType, string> = {
  files: 'Unused files',
  dependencies: 'Unused dependencies',
  devDependencies: 'Unused devDependencies',
  unlisted: 'Unlisted dependencies',
  binaries: 'Unlisted binaries',
  unresolved: 'Unresolved imports',
  exports: 'Unused exports',
  nsExports: 'Unused exports in namespaces',
  types: 'Unused exported types',
  nsTypes: 'Unused exported types in namespaces',
  enumMembers: 'Unused exported enum members',
  classMembers: 'Unused exported class members',
  duplicates: 'Duplicate exports',
};
