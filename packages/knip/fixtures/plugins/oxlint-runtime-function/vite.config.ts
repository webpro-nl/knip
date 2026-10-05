let calls = 0;

export default async ({ command, mode, ssrBuild }) => {
  if (++calls > 8) throw new Error('Config evaluated more than once per environment');
  await Promise.resolve();
  return {
    lint: {
      jsPlugins: [command === 'serve' ? 'eslint-plugin-regexp' : 'eslint-plugin-react-hooks'],
      overrides: mode === 'production' && ssrBuild ? [{ jsPlugins: ['eslint-plugin-runtime-ssr'] }] : [],
    },
  };
};
