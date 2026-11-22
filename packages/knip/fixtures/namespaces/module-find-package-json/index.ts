import { findPackageJSON } from 'node:module';
import module from 'module';

findPackageJSON('my-cli', import.meta.url);
module.findPackageJSON('@my-org/cli', import.meta.url);

// Ignored

findPackageJSON('..', import.meta.url);
findPackageJSON('./index.ts', import.meta.url);
module.findPackageJSON('/path/to/file.js');
findPackageJSON('file:///path/to/file.js');
