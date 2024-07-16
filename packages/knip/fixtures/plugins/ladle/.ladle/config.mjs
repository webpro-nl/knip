// For details see https://ladle.dev/docs/config
/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: "app/**/*.stories.{tsx,mdx}",
  viteConfig: process.cwd() + "./ladle/vite.config.ts",
};
