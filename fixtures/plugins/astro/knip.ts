export default {
  compilers: {
    astro: (text: string) => [...text.matchAll(/import[^;]+/g)].join('\n'),
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
    mdx: (text: string) => [...text.matchAll(/import[^;]+/g)].join('\n'),
  },
};
