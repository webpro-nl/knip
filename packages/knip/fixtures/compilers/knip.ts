import '@mdx-js/mdx';

export default {
  compilers: {
    md: (text, path) => {
      if (!path) throw new Error('Path not passed to compiler');
      return '';
    },
    css: async (text: string) => {
      return [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n');
    },
  },
};
