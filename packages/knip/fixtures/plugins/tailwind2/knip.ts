import { KnipConfig } from 'knip';

export default {
  compilers: {
    html: (text: string) =>
      [...text.matchAll(/<link[^>]+href="([^"]+)"/g)].map(match => `import '${match[1]}';`).join('\n'),
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
} satisfies KnipConfig;
