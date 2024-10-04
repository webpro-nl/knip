import type { IssueType } from './types/issues.js';

export const ROOT_WORKSPACE_NAME = '.';

export const IMPORT_STAR = '*';

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

export const PUBLIC_TAG = '@public';
export const INTERNAL_TAG = '@internal';
export const BETA_TAG = '@beta';
export const ALIAS_TAG = '@alias';

export const DT_SCOPE = '@types';

// Binaries that are expected to be globally installed
// In other words, https://www.npmjs.com/package/[name] is NOT the expected dependency
// Package may exist in npm registry, but last publish is at least 6 years ago
export const IGNORED_GLOBAL_BINARIES = new Set([
  'aws',
  'base64',
  'basename',
  'bash',
  'bun',
  'bundle',
  'bunx',
  'cat',
  'cd',
  'chown',
  'chmod',
  'cksum',
  'comm',
  'command',
  'corepack',
  'cp',
  'curl',
  'cut',
  'deno',
  'df',
  'dir',
  'dirname',
  'docker',
  'echo',
  'env',
  'exec',
  'exit',
  'expand',
  'expr',
  'factor',
  'false',
  'find',
  'gem',
  'git',
  'grep',
  'groups',
  'gzip',
  'head',
  'id',
  'join',
  'kill',
  'ln',
  'logname',
  'ls',
  'md5sum',
  'mkdir',
  'mknod',
  'mv',
  'nice',
  'nl',
  'nohup',
  'node',
  'npm',
  'nproc',
  'npx',
  'paste',
  'pnpm',
  'pnpx',
  'pr',
  'printenv',
  'pwd',
  'rm',
  'rmdir',
  'seq',
  'set',
  'sha1sum',
  'sha512sum',
  'sh',
  'shred',
  'shuf',
  'sort',
  'split',
  'ssh',
  'stat',
  'stty',
  'sudo',
  'sync',
  'tac',
  'tee',
  'test', // exception (node built-in module)
  'timeout',
  'touch',
  'tr',
  'true',
  'tsort',
  'tty',
  'uname',
  'unexpand',
  'uniq',
  'wc',
  'who',
  'whoami',
  'xargs',
  'xcodebuild',
  'xvfb-run',
  'yarn',
  'yes',
]);

export const IGNORED_DEPENDENCIES = new Set(['knip', 'typescript']);

export const IGNORED_RUNTIME_DEPENDENCIES = new Set(['bun', 'deno']);

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

export const IGNORE_DEFINITELY_TYPED = new Set([
  // The `@types/node` dependency does not require the `node` dependency
  'node',
  'bun',
  // Packages that confusingly include `package.json#types` but also recommend to install DT pkg
  'jest',
]);

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

export const FIX_FLAGS = {
  NONE: 0,
  OBJECT_BINDING: 1 << 0, // remove next comma
  EMPTY_DECLARATION: 1 << 1, // remove declaration if empty
} as const;
