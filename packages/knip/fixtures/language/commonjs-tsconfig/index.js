const all = require('./dir/script1');
const { staticResolve } = require('./dir/script1');
const { add } = require('./dir/exports');
const ts = require('./ts-ext');

const templateStringInternal = value => {
  const baz = require(`./dir/script2`);
  baz;
};

const requireResolve = value => {
  return require.resolve('./dir/script3');
};

renamed;
defaultName;
named;
all;
staticResolve;
add;
ts;
