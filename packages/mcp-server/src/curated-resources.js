export const CURATED_RESOURCES = {
  'getting-started': {
    name: 'Getting Started',
    description: 'New to Knip? Start here for installation and first run',
    path: 'overview/getting-started.mdx',
  },
  configuration: {
    name: 'Configuration',
    description: 'Understand configuration basics, defaults, and file locations',
    path: 'overview/configuration.md',
  },
  'configuring-project-files': {
    name: 'Configuring Project Files',
    description: 'READ FIRST for unused files or false positives. Covers entry/project patterns',
    path: 'guides/configuring-project-files.md',
  },
  'handling-issues': {
    name: 'Handling Issues',
    description: 'How to handle each issue type: files, dependencies, exports, types, duplicates',
    path: 'guides/handling-issues.mdx',
  },
  'monorepos-and-workspaces': {
    name: 'Monorepos & Workspaces',
    description: 'Multi-package repo? Configure workspaces and cross-references here',
    path: 'features/monorepos-and-workspaces.md',
  },
  'production-mode': {
    name: 'Production Mode',
    description: 'Exclude tests, stories, devDependencies with --production and --strict flags',
    path: 'features/production-mode.md',
  },
  compilers: {
    name: 'Compilers',
    description: 'Using .vue, .svelte, .astro, .mdx files? Configure compilers to parse them',
    path: 'features/compilers.md',
  },
  'configuration-reference': {
    name: 'Configuration Reference',
    description: 'Complete reference of all config options: entry, project, ignore, plugins, etc.',
    path: 'reference/configuration.md',
  },
  'plugins-explanation': {
    name: 'Plugins',
    description: 'Config files showing as unused? Understand plugin config vs entry files',
    path: 'explanations/plugins.md',
  },
  'entry-files': {
    name: 'Entry Files',
    description: 'Understand how Knip discovers entry files and default patterns per plugin',
    path: 'explanations/entry-files.md',
  },
  'plugin-list': {
    name: 'Plugin List',
    description: 'Check if a plugin exists for your tool (Jest, Vitest, ESLint, etc.)',
    path: 'reference/plugins.md',
  },
  'known-issues': {
    name: 'Known Issues',
    description: 'Errors or unexpected behavior? Check workarounds for common problems',
    path: 'reference/known-issues.md',
  },
};
