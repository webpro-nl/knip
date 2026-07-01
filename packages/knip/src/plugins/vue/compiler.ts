import { scriptBodies } from '../../compilers/compilers.ts';
import { stylePreprocessorImports } from '../../compilers/style-preprocessors.ts';
import type { CompilerSync } from '../../compilers/types.ts';

const compiler: CompilerSync = (text, path) => {
  const out = [scriptBodies(text, path), stylePreprocessorImports(text, path)];
  return out.filter(Boolean).join(';\n');
};

export default compiler;
