export default {
  spec: ['specs/*.test.js'],
  reporter: 'mocha-junit-reporter',
  loader: 'ts-node/esm',
  'node-option': ['import=tsx', 'no-warnings'],
};
