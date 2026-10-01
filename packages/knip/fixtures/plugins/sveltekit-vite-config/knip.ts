export default {
  compilers: {
    svelte: (text: string) => [...text.matchAll(/import[^;]+/g)].join('\n'),
  },
};
