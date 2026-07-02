const directiveMatcher = /@(?:import|config|plugin)\s+['"]([^'"]+)['"][^;]*;/g;

const compiler = (text: string) => {
  if (!text.includes('@import') && !text.includes('@config') && !text.includes('@plugin')) return '';
  const imports = [];
  let match: RegExpExecArray | null;
  let index = 0;

  directiveMatcher.lastIndex = 0;
  while ((match = directiveMatcher.exec(text))) if (match[1]) imports.push(`import _$${index++} from '${match[1]}';`);

  return imports.join('\n');
};

export default compiler;
