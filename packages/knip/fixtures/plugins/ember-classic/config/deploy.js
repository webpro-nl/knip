module.exports = function (deployTarget) {
  return { build: { environment: deployTarget } };
};
