import { blockCommentMatcher } from '../../compilers/compilers.ts';

const directiveMatcher = /@(?:import|config|plugin)\s+['"]([^'"]+)['"][^;]*;/g;

const compiler = (text: string) => {
  if (!text.includes('@import') && !text.includes('@config') && !text.includes('@plugin')) return '';
  const body = text.replace(blockCommentMatcher, '');
  const imports = [];
  let match: RegExpExecArray | null;
  let index = 0;

  directiveMatcher.lastIndex = 0;
  while ((match = directiveMatcher.exec(body))) if (match[1]) imports.push(`import _$${index++} from '${match[1]}';`);

  return imports.join('\n');
};

export default compiler;
