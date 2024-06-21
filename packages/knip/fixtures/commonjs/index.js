require('side-effects');
require('./odd');
const path = require('node:path');
const { named: renamed } = require('aliased-binding');
const defaultName = require('default-identifier');
const { named } = require('named-object-binding');
const all = require('./dir/mod');
const { staticResolve } = require('./dir/mod');
const { add } = require('./dir/exports');
const ts = require('./ts-ext');

const dynamicRequire = value => {
  return require(`./dir/${value}`);
};

const templateStringExternal = value => {
  return require(`no-substitution-tpl-literal`);
};

const templateStringInternal = value => {
  const baz = require(`./dir/mod1`);
  const { identifier } = require(`./dir/mod1`);

  baz;
  identifier;
};

const requireResolve = value => {
  return require.resolve('./dir/mod2');
};

const requireExportedShorthandsHeuristic = value => {
  const { identifier9, identifier10 } = require('./dir/mod3');
  [identifier9, identifier10];
};

const staticResolve = () => {
  return require.resolve('string-literal-resolve');
};

const staticResolved = () => {
  return require.resolve('resolved');
};

const dynamicResolve = () => {
  return require.resolve(path.join(process.cwd(), 'package.json'));
};

renamed;
defaultName;
named;
all;
staticResolve;
add;
