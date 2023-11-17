import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import { fixInternalLinks } from './scripts/fixInternalLinks';

const setForeground = (theme, scope, value) => {
  const settings = theme.settings.find(setting => setting.scope?.includes(scope));
  if (settings) settings.settings.foreground = value;
};

export default defineConfig({
  site: 'https://knip.dev',
  sitemap: false,
  trailingSlash: 'always',
  markdown: {
    remarkPlugins: [fixInternalLinks],
  },
  integrations: [
    expressiveCode({
      emitExternalStylesheet: true,
      frames: {
        showCopyToClipboardButton: true,
      },
      themes: ['min-dark'],
      theme: 'min-dark',
      customizeTheme: theme => {
        setForeground(theme, 'entity.name.tag', '#f68a22');
        setForeground(theme, 'entity.name.type', '#9DB1C5');
        return theme;
      },
    }),
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
