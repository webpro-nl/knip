/** @type {Record<string, { name: string; description: string; path: string; featured?: boolean }>} */
export const CURATED_RESOURCES = {
  configuration: {
    name: 'Configuration',
    description: 'Understand configuration basics, defaults, and file locations',
    path: 'overview/configuration',
  },
  'configuration-hints': {
    name: 'Configuration Hints',
    description: 'Decode the configurationHints from knip-run: each hint type and how to resolve it',
    path: 'reference/configuration-hints',
  },
  'configuring-project-files': {
    name: 'Configuring Project Files',
    description: 'READ FIRST for unused files or false positives. Covers entry/project patterns',
    path: 'guides/configuring-project-files',
  },
  'handling-issues': {
    name: 'Handling Issues',
    description: 'How to resolve each issue type: files, dependencies, exports, types, duplicates',
    path: 'guides/handling-issues',
  },
  'known-issues': {
    name: 'Known Issues',
    description: 'Errors or unexpected behavior? Check workarounds for common problems',
    path: 'reference/known-issues',
  },
  'issue-types': {
    name: 'Issue Types',
    description:
      'Decode knip-run output: every issue type, what it means and its key (files, dependencies, exports, …)',
    path: 'reference/issue-types',
  },
  'monorepos-and-workspaces': {
    name: 'Monorepos & Workspaces',
    description: 'Multi-package repo? Configure workspaces and cross-references here',
    path: 'features/monorepos-and-workspaces',
  },
  'production-mode': {
    name: 'Production Mode',
    description: 'Exclude tests, stories, devDependencies with --production and --strict flags',
    path: 'features/production-mode',
  },
  'rules-and-filters': {
    name: 'Rules & Filters',
    description: 'Focus or mute issue types with --include/--exclude and rules',
    path: 'features/rules-and-filters',
  },
  compilers: {
    name: 'Compilers',
    description: 'Using .vue, .svelte, .astro, .mdx files? Configure compilers to parse them',
    path: 'features/compilers',
  },
  'jsdoc-tsdoc-tags': {
    name: 'JSDoc & TSDoc Tags',
    description: 'Keep an export but exclude it from the report with @public/@internal and custom tags',
    path: 'reference/jsdoc-tsdoc-tags',
  },
  'configuration-reference': {
    name: 'Configuration Reference',
    description: 'Complete reference of all config options: entry, project, ignore, plugins, etc.',
    path: 'reference/configuration',
  },
  'plugins-explanation': {
    name: 'Plugins',
    description: 'Config files showing as unused? Understand plugin config vs entry files',
    path: 'explanations/plugins',
  },
  'entry-files': {
    name: 'Entry Files',
    description: 'Understand how Knip discovers entry files and default patterns per plugin',
    path: 'explanations/entry-files',
  },
  'plugin-list': {
    name: 'Plugin List',
    description: 'Check if a plugin exists for your tool (Jest, Vitest, ESLint, etc.)',
    path: 'reference/plugins',
  },
};
