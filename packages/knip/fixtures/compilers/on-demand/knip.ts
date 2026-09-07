const compiled = new Set<string>();

const compile = (text: string, path: string) => {
  if (compiled.has(path)) throw new Error(`Compiled twice: ${path}`);
  if (text.trim() === 'unused') throw new Error('Compiled an unreferenced source');
  compiled.add(path);
  return text.replaceAll('@import', 'import');
};

export default {
  entry: ['index.ts'],
  project: ['*.ts', '*.sync', '*.thenable', '*.native'],
  compilers: {
    sync: compile,
    thenable: (text: string, path: string) => ({
      then: (resolve: (source: string) => void) => resolve(compile(text, path)),
    }),
    native: async (text: string, path: string) => compile(text, path),
  },
};
