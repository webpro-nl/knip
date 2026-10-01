export default {
  compilers: {
    foo: (text: string) => Promise.resolve(text),
  },
};
