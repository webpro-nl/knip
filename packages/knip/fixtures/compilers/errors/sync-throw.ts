export default {
  compilers: {
    foo: () => {
      throw new Error('compiler failed');
    },
  },
};
