import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';

/** @type {import('@astrojs/starlight/expressive-code').StarlightExpressiveCodeOptions} */
export default {
  themes: ['starlight-dark', 'starlight-light'],
  plugins: [pluginLineNumbers()],
};
