import type { IssueType } from './types/issues.js';

export const ROOT_WORKSPACE_NAME = '.';

export const KNIP_CONFIG_LOCATIONS = [
  'knip.json',
  'knip.jsonc',
  '.knip.json',
  '.knip.jsonc',
  'knip.ts',
  'knip.js',
  'knip.config.ts',
  'knip.config.js',
];

// TS extensions: https://github.com/microsoft/TypeScript/blob/da8dfbf0ff6a94df65568fd048aec0d763c65811/src/compiler/types.ts#L7637-L7651
export const DEFAULT_EXTENSIONS = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.mts', '.cts'];

export const GLOBAL_IGNORE_PATTERNS = ['**/node_modules/**', '.yarn'];

// Binaries that are expected to be globally installed
// In other words, https://www.npmjs.com/package/[name] is NOT the expected dependency
// Package may exist in npm registry, but last publish is at least 6 years ago
export const IGNORED_GLOBAL_BINARIES = new Set([
  'bash',
  'bun',
  'bunx',
  'cat',
  'cd',
  'chmod',
  'corepack',
  'cp',
  'curl',
  'deno',
  'dirname',
  'docker',
  'echo',
  'exec',
  'exit',
  'find',
  'git',
  'grep',
  'gzip',
  'ls',
  'mkdir',
  'mv',
  'node',
  'npm',
  'npx',
  'pnpm',
  'pnpx',
  'rm',
  'set',
  'sh',
  'sudo',
  'test', // exception (node built-in module)
  'true',
  'yarn',
  'xargs',
]);

export const IGNORED_DEPENDENCIES = new Set(['knip', 'typescript']);

export const IGNORED_RUNTIME_DEPENDENCIES = new Set(['bun']);

// Extensions sometimes imported directly (and compiled away by bundlers, etc.)
export const DUMMY_VIRTUAL_FILE_EXTENSIONS = new Set(['.html', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

export const IGNORED_FILE_EXTENSIONS = new Set([
  '.avif',
  '.css',
  '.eot',
  '.gif',
  '.ico',
  '.less',
  '.sass',
  '.scss',
  '.sh',
  '.ttf',
  '.woff',
  '.woff2',
  '.yaml',
  '.yml',
  ...DUMMY_VIRTUAL_FILE_EXTENSIONS,
]);

// The `@types/node` dependency does not require the `node` dependency
export const IGNORE_DEFINITELY_TYPED = ['node', 'bun'];

export const ISSUE_TYPES: IssueType[] = [
  'files',
  'dependencies',
  'devDependencies',
  'optionalPeerDependencies',
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
  optionalPeerDependencies: 'Referenced optional peerDependencies',
  unlisted: 'Unlisted dependencies',
  binaries: 'Unlisted binaries',
  unresolved: 'Unresolved imports',
  exports: 'Unused exports',
  nsExports: 'Exports in used namespace',
  types: 'Unused exported types',
  nsTypes: 'Exported types in used namespace',
  enumMembers: 'Unused exported enum members',
  classMembers: 'Unused exported class members',
  duplicates: 'Duplicate exports',
};
