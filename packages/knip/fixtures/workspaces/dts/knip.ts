/** @type {import('knip').KnipConfig} */
const config = {
  workspaces: {
    'packages/shared': {
      includeEntryExports: true,
    },
  },
};

export default config;
