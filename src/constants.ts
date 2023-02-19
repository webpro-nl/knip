import type { IssueType } from './types/issues.js';

export const ROOT_WORKSPACE_NAME = '.';

export const KNIP_CONFIG_LOCATIONS = ['knip.json', 'knip.jsonc', '.knip.json', '.knip.jsonc', 'knip.ts', 'knip.js'];

export const DEFAULT_EXTENSIONS = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx'];

// This is what gets excluded in --production mode (apart from what plugins would add)
export const TEST_FILE_PATTERNS = ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/__tests__/**/*.{js,jsx,ts,tsx}'];

// Binaries that are expected to be globally installed (i.e. https://www.npmjs.com/package/[name] is NOT the expected dependency)
export const IGNORED_GLOBAL_BINARIES = [
  'bun',
  'deno',
  'git',
  'node',
  'npm',
  'npx',
  'pnpm',
  'yarn',
  // Packages exist, but are at least 6 years old:
  'cd',
  'cp',
  'echo',
  'exit',
  'mkdir',
  'mv',
  'rm',
  'sh',
  'sudo',
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
];

// The `@types/node` dependency does not require the `node` dependency
export const IGNORE_DEFINITELY_TYPED = ['node'];

export const ISSUE_TYPES: IssueType[] = [
  'files',
  'dependencies',
  'devDependencies',
  'unlisted',
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
  devDependencies: 'Unused dev dependencies',
  unlisted: 'Unlisted dependencies',
  unresolved: 'Unresolved imports',
  exports: 'Unused exports',
  nsExports: 'Unused exports in namespaces',
  types: 'Unused exported types',
  nsTypes: 'Unused exported types in namespaces',
  enumMembers: 'Unused exported enum members',
  classMembers: 'Unused exported class members',
  duplicates: 'Duplicate exports',
};
