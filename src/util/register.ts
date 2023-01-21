import module from 'node:module';
import { register } from 'esbuild-register/dist/node.js';

// Register esbuild for CommonJS (esm-loader doesn't hook into require() calls or transform CommonJS files)
register();

/**
 * When loading foreign JS/TS from plugins (using `_load`), non-JS things like .svg or .css files might be imported.
 * For instance, in Storybook configuration through Webpack loaders. So here we install dummy extension handlers.
 *
 * Also see:
 * - https://github.com/nodejs/node/blob/main/lib/internal/modules/cjs/loader.js
 * - https://github.com/danez/pirates/blob/main/src/index.js
 */

// @ts-expect-error Undocumented and not typed (hacky, but common practice)
const extensions = module.Module._extensions;

// @ts-expect-error No type definition available for the `module argument` (it's CommonJS and not TypeScript)
const exportFilePath = (module, filePath: string) => {
  module.exports = filePath;
};

// TODO This is awkward and incomplete. There must be a better way for "everything not JS/TS"?
[
  'avif',
  'css',
  'eot',
  'gif',
  'ico',
  'jpeg',
  'jpg',
  'less',
  'png',
  'sass',
  'scss',
  'svg',
  'ttf',
  'webp',
  'woff',
  'woff2',
].forEach(ext => {
  extensions[`.${ext}`] = exportFilePath;
});
