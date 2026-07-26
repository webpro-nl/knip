import { dynamicImportsWithinTemplate, importsWithinScripts } from '../../compilers/compilers.ts';
import { stylePreprocessorImports } from '../../compilers/style-preprocessors.ts';
import type { CompilerSync } from '../../compilers/types.ts';

const compiler: CompilerSync = (text, path) => {
  const parts = [
    importsWithinScripts(text, path),
    dynamicImportsWithinTemplate(text, path),
    stylePreprocessorImports(text, path),
  ];
  return parts.filter(Boolean).join(';\n');
};

export default compiler;
