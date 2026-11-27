export default {
  run: {
    tasks: {
      dev: { command: 'bun --watch main.ts' },
      start: { command: './main.ts' },
    },
  },
};
