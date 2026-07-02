import { importsWithinScripts } from '../../compilers/compilers.ts';
import { stylePreprocessorImports } from '../../compilers/style-preprocessors.ts';
import type { CompilerSync } from '../../compilers/types.ts';

const compiler: CompilerSync = (text, path) => {
  const scripts = importsWithinScripts(text, path);
  const styles = stylePreprocessorImports(text, path);
  if (!scripts) return styles;
  return styles ? `${scripts};\n${styles}` : scripts;
};

export default compiler;
