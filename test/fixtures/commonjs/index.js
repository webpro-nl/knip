require('side-effects');
require('./odd');
const path = require('node:path');
const { named: renamed } = require('aliased-binding');
const defaultName = require('default-identifier');
const { named } = require('named-object-binding');
const all = require('./dir/mod');
const { staticResolve } = require('./dir/mod');

const dynamicRequire = (value: string) => {
  return require(`./dir/${value}`);
};

const templateStringExternal = (value: string) => {
  return require(`no-substitution-tpl-literal`);
};

const templateStringInternal = (value: string) => {
  const baz = require(`./dir/mod1`);
  const { identifier } = require(`./dir/mod1`);
};

const requireResolve = (value: string) => {
  return require.resolve('./dir/mod2');
};

const requireExportedShorthandsHeuristic = (value: string) => {
  const { identifier, identifier2 } = require('./dir/mod3');
};

const staticResolve = () => {
  return require.resolve('string-literal-resolve');
};

const dynamicResolve = () => {
  return require.resolve(path.join(process.cwd(), 'package.json'));
};
