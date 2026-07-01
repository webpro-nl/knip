import { styleBodiesByLang } from './compilers.ts';
import { compiler as lessCompiler } from './less.ts';
import { compiler as scssCompiler } from './scss.ts';
import { compiler as stylusCompiler } from './stylus.ts';
import type { CompilerSync } from './types.ts';

// `<style lang="...">` preprocessors used by Astro, Vue and Svelte components.
const preprocessors: Array<[langs: string[], compile: CompilerSync]> = [
  [['scss', 'sass'], scssCompiler],
  [['less'], lessCompiler],
  [['styl', 'stylus'], stylusCompiler],
];

export const stylePreprocessorImports: CompilerSync = (text, path) => {
  const out: string[] = [];
  for (const [langs, preprocess] of preprocessors) {
    const body = styleBodiesByLang(text, langs);
    if (!body) continue;
    const imports = preprocess(body, path);
    if (imports) out.push(imports);
  }
  return out.join('\n');
};
