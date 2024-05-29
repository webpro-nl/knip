import type { IssueType } from './types/issues.js';

export const ROOT_WORKSPACE_NAME = '.';

export const ANONYMOUS = '__anonymous';

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
  'aws',
  'bash',
  'bun',
  'bundle',
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
  'env',
  'exec',
  'exit',
  'find',
  'gem',
  'git',
  'grep',
  'gzip',
  'ln',
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
  'touch',
  'true',
  'yarn',
  'xargs',
  'xcodebuild',
]);

export const IGNORED_DEPENDENCIES = new Set(['knip', 'typescript']);

export const IGNORED_RUNTIME_DEPENDENCIES = new Set(['bun']);

export const FOREIGN_FILE_EXTENSIONS = new Set([
  '.avif',
  '.css',
  '.eot',
  '.gif',
  '.html',
  '.ico',
  '.jpeg',
  '.jpg',
  '.less',
  '.mp3',
  '.png',
  '.sass',
  '.scss',
  '.sh',
  '.svg',
  '.ttf',
  '.webp',
  '.woff',
  '.woff2',
  '.yaml',
  '.yml',
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
  _files: 'Unused files',
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
