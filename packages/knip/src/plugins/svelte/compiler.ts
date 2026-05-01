import { importMatcher } from '../../compilers/compilers.ts';
import type { CompilerSync } from '../../compilers/types.ts';

const scriptExtractor = /<script\b([^>]*)>([\s\S]*?)<\/script>/gm;
const moduleAttrMatcher = /(?:^|\s)module(?=\s|$|=|>)|(?:^|\s)context\s*=\s*['"]module['"]/;

const compiler: CompilerSync = (text: string) => {
  const chunks: string[] = [];
  for (const match of text.matchAll(scriptExtractor)) {
    const [, attrs, body] = match;
    if (moduleAttrMatcher.test(attrs)) {
      chunks.push(body);
    } else {
      for (const importMatch of body.matchAll(importMatcher)) chunks.push(importMatch[0]);
    }
  }
  return chunks.join(';\n');
};

export default compiler;
