export default {
  entry: ['entry.source'],
  project: ['*.source'],
  compilers: {
    source: (text: string) => `require("${JSON.parse(text)}");`,
  },
};
