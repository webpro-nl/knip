import { defineEcConfig } from 'astro-expressive-code';
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';

export default defineEcConfig({
  themes: ['dracula', 'github-light'],
  plugins: [pluginCollapsibleSections()],
});
