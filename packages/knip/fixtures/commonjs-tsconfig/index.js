const all = require('./dir/mod');
const { staticResolve } = require('./dir/mod');
const { add } = require('./dir/exports');
const ts = require('./ts-ext');

const templateStringInternal = value => {
  const baz = require(`./dir/mod1`);
  baz;
};

const requireResolve = value => {
  return require.resolve('./dir/mod2');
};

renamed;
defaultName;
named;
all;
staticResolve;
add;
ts;
