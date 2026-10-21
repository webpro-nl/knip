export default {
  entry: ['entry.ts'],
  project: ['*.ts', '*.source'],
  compilers: {
    source: (text: string) => JSON.parse(text),
  },
};
