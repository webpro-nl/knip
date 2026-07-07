import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import remarkDirective from 'remark-directive';
import starlightThemeRapide from 'starlight-theme-rapide';
import { fixInternalLinks } from './remark/fixInternalLinks.ts';
import { transformDirectives } from './remark/transformDirectives.ts';

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
      title: 'Knip ✂️',
      plugins: [starlightThemeRapide()],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/webpro-nl/knip' },
        { icon: 'blueSky', label: 'Bluesky', href: 'https://bsky.app/profile/webpro.nl' },
        { icon: 'npm', label: 'npm', href: 'https://www.npmx.dev/package/knip' },
      ],
      components: {
        Head: './src/components/Head.astro',
        Footer: './src/components/Footer.astro',
      },
      customCss: ['./src/styles/custom.css'],
      lastUpdated: true,
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
        frames: {
          showCopyToClipboardButton: true,
        },
      },
    }),
  ],
});
