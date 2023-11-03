import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { fixInternalLinks } from './scripts/fixInternalLinks';

export default defineConfig({
  site: 'https://knip.dev',
  sitemap: false,
  trailingSlash: 'always',
  markdown: {
    remarkPlugins: [fixInternalLinks],
  },
  integrations: [
    starlight({
      title: 'knip.dev',
      logo: {
        light: './src/assets/title-light.svg',
        dark: './src/assets/title-dark.svg',
        replacesTitle: true,
      },
      social: {
        github: 'https://github.com/webpro/knip',
        discord: 'https://discord.gg/r5uXTtbTpc',
        'x.com': 'https://x.com/webprolific',
      },
      components: {
        Head: './src/components/Head.astro',
        Footer: './src/components/Footer.astro',
      },
      customCss: ['./src/styles/custom.css', './src/fonts/font-face.css'],
      sidebar: [
        {
          label: 'Overview',
          autogenerate: { directory: 'overview' },
        },
        {
          label: 'Understanding Knip',
          autogenerate: { directory: 'explanations' },
        },
        {
          label: 'Features',
          autogenerate: { directory: 'features' },
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
        {
          label: 'Blog',
          autogenerate: { directory: 'blog' },
        },
      ],
    }),
  ],
});
