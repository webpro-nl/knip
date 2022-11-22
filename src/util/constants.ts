export const ROOT_WORKSPACE_NAME = '.';

// This is what gets excluded in --production mode (apart from what plugins would include)
export const TEST_FILE_PATTERNS = ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/__tests__/**/*.{js,jsx,ts,tsx}'];

// Binaries that are expected to be globally installed when using a certain project
export const IGNORED_GLOBAL_BINARIES = ['npm', 'npx', 'node', 'yarn', 'pnpm'];

// Not many programs accept another program as their first argument
// Does this make sense? Can we manage? It does make the whole `npm script` plugin quite powerful, though.
export const FIRST_ARGUMENT_AS_BINARY_EXCEPTIONS = ['cross-env', 'dotenv'];
