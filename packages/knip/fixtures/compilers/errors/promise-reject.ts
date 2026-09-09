export default {
  compilers: {
    foo: () => Promise.reject(new Error('compiler failed')),
  },
};
