export default {
  plugins: {
    '@release-it/bumper': {},
  },
  hooks: {
    'after:bump': 'from-hook',
  },
};
