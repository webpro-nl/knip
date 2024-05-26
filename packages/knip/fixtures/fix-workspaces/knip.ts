export default {
  ignoreWorkspaces: ['packages/ignored'],
  workspaces: {
    '.': {
      ignore: ['ignored.ts'],
      ignoreDependencies: ['ignored'],
    },
    'packages/lib': {
      ignore: ['ignored.ts'],
      ignoreDependencies: ['ignored'],
    },
  },
};
