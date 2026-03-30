export default {
  ignoreBinaries: ['eslint', /^ts.+/, /.*unused-bins.*/, 'executable!'],
  ignoreDependencies: ['stream', /^@org\/.*/, /^rc-.*/, /.+unused-deps.+/, 'package!'],
};
