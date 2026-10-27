import module, { findPackageJSON } from 'node:module';
console.log(findPackageJSON('my-cli', import.meta.url));
console.log(module.findPackageJSON('other-cli', import.meta.url));
console.log(findPackageJSON('/abs', import.meta.url));
console.log(findPackageJSON('..', import.meta.url));
