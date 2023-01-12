import type { IssueType } from './types/issues.js';

export const ROOT_WORKSPACE_NAME = '.';

// Zero-config means the following defaults are applied (either for none at all, or for workspaces individually)
export const DEFAULT_WORKSPACE_CONFIG = {
  entry: ['index.{js,ts,tsx}!', 'src/index.{js,ts,tsx}!'],
  project: ['**/*.{js,ts,tsx}!'],
  ignore: [],
};

// This is what gets excluded in --production mode (apart from what plugins would include)
export const TEST_FILE_PATTERNS = ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/__tests__/**/*.{js,jsx,ts,tsx}'];

// Binaries that are expected to be globally installed when using a certain project
// This assumes for each of them that https://www.npmjs.com/package/[name] is NOT the expected dependency.
export const IGNORED_GLOBAL_BINARIES = ['npm', 'npx', 'node', 'yarn', 'pnpm', 'deno', 'git'];

// The `@types/node` dependency does not require the `node` dependency
export const IGNORE_DEFINITELY_TYPED = ['node'];

// Some programs accept another program as their first argument (it's often an argument/sub-program e.g. `git commit`)
export const FIRST_ARGUMENT_AS_BINARY_EXCEPTIONS = ['npx', 'cross-env', 'dotenv'];

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
