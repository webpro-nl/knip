export default {
  entry: ['src/App.svelte'],
  compilers: {
    svelte: (text: string) => [...text.matchAll(/import[^;]+/g)].join('\n'),
  },
};
