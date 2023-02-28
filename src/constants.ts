import type { IssueType } from './types/issues.js';

export const ROOT_WORKSPACE_NAME = '.';

export const KNIP_CONFIG_LOCATIONS = ['knip.json', 'knip.jsonc', '.knip.json', '.knip.jsonc', 'knip.ts', 'knip.js'];

const DEFAULT_FILE_EXTENSIONS = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx'];

const extsGlobStr = DEFAULT_FILE_EXTENSIONS.map(ext => ext.slice(1)).join(',');

// Zero-config means the following defaults are applied (either for none at all, or for workspaces individually)
export const DEFAULT_WORKSPACE_CONFIG = {
  entry: [`index.{${extsGlobStr}}!`, `src/index.{${extsGlobStr}}!`],
  project: [`**/*.{${extsGlobStr}}!`],
  paths: {},
  ignore: [],
};

// This is what gets excluded in --production mode (apart from what plugins would include)
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

// The `@types/node` dependency does not require the `node` dependency
export const IGNORE_DEFINITELY_TYPED = ['node'];

export const ISSUE_TYPES: IssueType[] = [
  'files',
  'dependencies',
  'devDependencies',
  'unlisted',
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
  unlisted: 'Unlisted or unresolved dependencies',
  exports: 'Unused exports',
  nsExports: 'Unused exports in namespaces',
  types: 'Unused exported types',
  nsTypes: 'Unused exported types in namespaces',
  enumMembers: 'Unused exported enum members',
  classMembers: 'Unused exported class members',
  duplicates: 'Duplicate exports',
};
