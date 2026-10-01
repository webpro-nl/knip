export default {
  ignore: '.astro/types.d.ts',
  ignoreExportsUsedInFile: true,
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};
