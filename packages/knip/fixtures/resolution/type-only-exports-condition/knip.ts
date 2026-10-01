/** @type {import('knip').KnipConfig} */
const config = {
  workspaces: {
    'packages/contracts': {
      includeEntryExports: true,
    },
  },
};
export default config;
