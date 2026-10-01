import { appendFileSync } from 'node:fs';

export default {
  entry: ['index.ts'],
  project: ['*.ts', '*.foo'],
  compilers: {
    foo: async (text: string, path: string) => {
      appendFileSync(`${path}.calls`, text);
      const name = text.trim();
      if (name === 'invalid') throw new Error('Invalid fruit');
      return `import { ${name} } from './fruits.ts'; console.log(${name});`;
    },
  },
};
