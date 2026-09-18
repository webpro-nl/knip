export default {
  compilers: {
    foo: () => Promise.resolve(42),
  },
};
