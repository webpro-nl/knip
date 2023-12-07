export default {
  ignoreBinaries: ['eslint', /^ts.+/, /.*unused-bins.*/],
  ignoreDependencies: ['stream', /^@org\/.*/, /^rc-.*/, /.+unused-deps.+/],
};
