// The CJS build of Vite's Node API is deprecated. See https://vitejs.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.

// SyntaxError: Cannot use 'import.meta' outside a module

import.meta;
import.meta.resolve;
import.meta.url;

// SyntaxError: await is only valid in async functions and the top level bodies of modules

// SyntaxError: missing ) after argument list

// SyntaxError: Unexpected identifier 'Promise'
Promise;

// Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in [...]/node_modules/estree-walker/package.json

await Promise.resolve('TLA');
