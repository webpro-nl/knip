const path = require('node:path');

const dynamicRequire = (value: string) => {
  return require(`./dir/${value}`);
};

const templateStringExternal = (value: string) => {
  return require(`no-substitution-tpl-literal`);
};

const templateStringInternal = (value: string) => {
  return require(`./dir/value-c`);
};

const staticResolve = () => {
  return require.resolve('string-literal');
};

const dynamicResolve = () => {
  return require.resolve(path.join(process.cwd(), 'package.json'));
};
