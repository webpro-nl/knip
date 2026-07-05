import { getStyleLang, styleExtractor } from './compilers.ts';
import { compiler as lessCompiler } from './less.ts';
import { compiler as scssCompiler } from './scss.ts';
import { compiler as stylusCompiler } from './stylus.ts';
import type { CompilerSync } from './types.ts';

export const stylePreprocessorImports: CompilerSync = (text, path) => {
  let scss = '';
  let less = '';
  let stylus = '';

  styleExtractor.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = styleExtractor.exec(text))) {
    const attrs = match[1];
    const body = match[2];
    if (!body) continue;
    switch (getStyleLang(attrs)) {
      case 'scss':
      case 'sass':
        scss = scss ? `${scss}\n${body}` : body;
        break;
      case 'less':
        less = less ? `${less}\n${body}` : body;
        break;
      case 'styl':
      case 'stylus':
        stylus = stylus ? `${stylus}\n${body}` : body;
    }
  }

  let out = scss ? scssCompiler(scss, path) : '';
  if (less) {
    const imports = lessCompiler(less, path);
    if (imports) out = out ? `${out}\n${imports}` : imports;
  }
  if (stylus) {
    const imports = stylusCompiler(stylus, path);
    if (imports) out = out ? `${out}\n${imports}` : imports;
  }
  return out;
};
