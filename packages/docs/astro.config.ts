import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import starlight from '@astrojs/starlight';
import type { ExpressiveCodeTheme } from '@astrojs/starlight/expressive-code';
import { defineConfig } from 'astro/config';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkDirective from 'remark-directive';
import { fixInternalLinks } from './remark/fixInternalLinks.ts';
import { transformDirectives } from './remark/transformDirectives.ts';

const setForeground = (theme: ExpressiveCodeTheme, scope: string, value: string) => {
  const settings = theme.settings.find(setting => setting.scope?.includes(scope));
  if (settings) settings.settings.foreground = value;
};

export default defineConfig({
  site: 'https://knip.dev',
  base: '/',
  // @ts-expect-error
  sitemap: false,
  trailingSlash: 'never',
  redirects: {
    '/guides/commonjs': '/guides/working-with-commonjs',
  },
  markdown: {
    remarkPlugins: [fixInternalLinks, transformDirectives, remarkDirective],
    rehypePlugins: [rehypeHeadingIds, rehypeAutolinkHeadings],
  },
  experimental: {
    svg: true,
  },
  integrations: [
    starlight({
      title: 'Knip',
      logo: {
        light: './src/assets/title-light.svg',
        dark: './src/assets/title-dark.svg',
        replacesTitle: true,
      },
      social: {
        github: 'https://github.com/webpro-nl/knip',
        discord: 'https://discord.gg/r5uXTtbTpc',
        blueSky: 'https://bsky.app/profile/webpro.nl',
      },
      components: {
        Head: './src/components/Head.astro',
        Footer: './src/components/Footer.astro',
      },
      customCss: ['./src/styles/custom.css', './src/fonts/font-face.css'],
      editLink: {
        baseUrl: 'https://github.com/webpro-nl/knip/edit/main/packages/docs/',
      },
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
        {
          label: 'Read more',
          collapsed: true,
          autogenerate: { directory: 'typescript' },
        },
      ],
      expressiveCode: {
        emitExternalStylesheet: true,
        styleOverrides: {
          // @ts-expect-error deal with it
          'frm-tooltipSuccessBg': 'var(--sl-color-orange)',
          'frm-tooltipSuccessFg': 'var(--sl-color-white)',
          'frm-edBg': 'var(--sl-color-black)',
          'frm-edActTabBg': 'var(--sl-color-black)',
          'frm-edActTabBrdCol': 'var(--sl-color-black)',
          'frm-edTabBarBg': 'none',
          'frm-edTabBarBrdBtmCol': 'none',
          'frm-frameBoxShdCssVal': 'none',
        },
        frames: {
          showCopyToClipboardButton: true,
        },
        themes: ['min-dark'],
        customizeTheme: theme => {
          setForeground(theme, 'entity.name.tag', '#f68a22');
          setForeground(theme, 'entity.name.type', '#ededed');
          setForeground(theme, 'string', '#ededed');
          return theme;
        },
      },
    }),
  ],
});
