module.exports = function (environment) {
  const { EMBER_ENV } = process.env;
  return { modulePrefix: EMBER_ENV ?? 'orchard-app', environment };
};
