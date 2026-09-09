export default {
  compilers: {
    foo: async () => {
      throw new Error('compiler failed');
    },
  },
};
