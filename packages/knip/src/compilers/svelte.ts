import { scriptExtractor, styleExtractor } from './compilers.ts';
import type { CompilerSync } from './types.ts';

const htmlCommentMatcher = /<!--[\s\S]*?-->/g;
const dynamicImportMatcher =
  /(?<![.\w$#])import(?:\s|\/\/[^\r\n\u2028\u2029]*(?:[\r\n\u2028\u2029]|$)|\/\*[\s\S]*?(?:\*\/|$))*\((?:\s|\/\/[^\r\n\u2028\u2029]*(?:[\r\n\u2028\u2029]|$)|\/\*[\s\S]*?(?:\*\/|$))*(?:"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\$]|\$(?!\{))*`)[^)]*\)/g;
const svelteExpressionMatcher = /{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/g;
const javascriptNonCodeMatcher =
  /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\$]|\$(?!\{))*`|\/\/[^\r\n\u2028\u2029]*|\/\*[\s\S]*?(?:\*\/|$)/g;

export const dynamicImportsWithinTemplate: CompilerSync = text => {
  const template = text.replace(scriptExtractor, '').replace(styleExtractor, '').replace(htmlCommentMatcher, '');
  if (!template.includes('import')) return '';
  const imports: string[] = [];
  for (const expressionMatch of template.matchAll(svelteExpressionMatcher)) {
    const expression = expressionMatch[0];
    const code = expression.replace(javascriptNonCodeMatcher, match => ' '.repeat(match.length));
    dynamicImportMatcher.lastIndex = 0;
    let importMatch: RegExpExecArray | null;
    while ((importMatch = dynamicImportMatcher.exec(expression))) {
      if (code.startsWith('import', importMatch.index)) imports.push(importMatch[0]);
    }
  }
  return imports.join(';\n');
};
