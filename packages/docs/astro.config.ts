import starlight from '@astrojs/starlight';
import type { ExpressiveCodeTheme } from '@astrojs/starlight/expressive-code';
import { defineConfig } from 'astro/config';
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
    '/guides/writing-a-plugin': '/writing-a-plugin',
  },
  markdown: {
    remarkPlugins: [fixInternalLinks, transformDirectives, remarkDirective],
  },
  integrations: [
    starlight({
      title: 'Knip',
      logo: {
        light: './src/assets/title-light.svg',
        dark: './src/assets/title-dark.svg',
        replacesTitle: true,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/webpro-nl/knip' },
        { icon: 'blueSky', label: 'Bluesky', href: 'https://bsky.app/profile/webpro.nl' },
        { icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/knip' },
      ],
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
          label: 'Start here',
          items: [
            'overview/getting-started',
            'explanations/how-knip-works',
            'overview/first-cleanup',
            'overview/configuration',
            'explanations/why-use-knip',
          ],
        },
        {
          label: 'Configuration & discovery',
          items: [
            'explanations/entry-files',
            'explanations/plugins',
            'guides/configuring-project-files',
            'features/production-mode',
            'reference/configuration-hints',
            'features/compilers',
            'features/script-parser',
            'features/source-mapping',
            'features/custom-elements',
            'guides/namespace-imports',
            'guides/working-with-commonjs',
          ],
        },
        {
          label: 'Monorepos',
          items: ['features/monorepos-and-workspaces', 'features/integrated-monorepos', 'features/catalogs'],
        },
        {
          label: 'Troubleshooting',
          items: [
            'guides/troubleshooting',
            'guides/handling-issues',
            'reference/known-issues',
            'features/auto-fix',
            'reference/faq',
            'reference/related-tooling',
          ],
        },
        {
          label: 'Integration',
          items: ['guides/adopt-gradually', 'guides/using-knip-in-ci', 'guides/performance', 'reference/integrations'],
        },
        {
          label: 'Reference',
          items: [
            'reference/cli',
            'reference/configuration',
            'reference/dynamic-configuration',
            'reference/issue-types',
            'features/rules-and-filters',
            'reference/jsdoc-tsdoc-tags',
            'features/reporters',
            'reference/plugins',
            'overview/features',
            'explanations/comparison-and-migration',
            'playground',
          ],
        },
        {
          label: 'Contributing',
          items: [
            'guides/contributing',
            'guides/issue-reproduction',
            {
              label: 'Writing A Plugin',
              items: ['writing-a-plugin', 'writing-a-plugin/inputs', 'writing-a-plugin/argument-parsing'],
            },
          ],
        },
        {
          label: 'Blog',
          items: [{ autogenerate: { directory: 'blog' } }],
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
