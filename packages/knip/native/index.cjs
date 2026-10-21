const targets = require('./targets.cjs');

const load = () => {
  const platform = `${process.platform}-${process.arch}`;
  const errors = [];
  const forceWasi = process.env.NAPI_RS_FORCE_WASI === 'true' || process.env.NAPI_RS_FORCE_WASI === 'error';
  for (const target of forceWasi ? [] : (targets[platform] ?? [])) {
    try {
      return require(`./knip-native.${target}.node`);
    } catch (error) {
      errors.push(error);
    }
  }
  try {
    return require('./knip-native.wasi.cjs');
  } catch (error) {
    errors.push(error);
  }
  throw new AggregateError(
    errors,
    `Knip native and WASI addons are unavailable for ${platform}. Reinstall Knip, or build the addons when running from source.`,
    { cause: errors[0] }
  );
};

module.exports = load();
