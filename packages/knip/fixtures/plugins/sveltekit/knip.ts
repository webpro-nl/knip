export default {
  ignore: ['.svelte-kit'],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
    svelte: (text: string) => [...text.matchAll(/import[^;]+/g)].join('\n'),
  },
};
