const directiveMatcher =
  /"(?:\\(?:\r\n|[\s\S]|$)|[^"\\\r\n\f])*(?:"|[\r\n\f]|$)|'(?:\\(?:\r\n|[\s\S]|$)|[^'\\\r\n\f])*(?:'|[\r\n\f]|$)|\/\*[\s\S]*?(?:\*\/|$)|@(?:(?:import|config|plugin)\s+['"]([^'"]+)['"]|import\s+url\(\s*(?:['"]([^'"]+)['"]|([^'")\s]+))\s*\))[^;]*;/g;

const urlSchemeMatcher = /^[a-z][a-z\d+.-]*:/i;

const compiler = (text: string) => {
  if (!text.includes('@import') && !text.includes('@config') && !text.includes('@plugin')) return '';
  const imports = [];
  let match: RegExpExecArray | null;
  let index = 0;

  directiveMatcher.lastIndex = 0;
  while ((match = directiveMatcher.exec(text))) {
    const url = match[2] ?? match[3];
    const specifier = match[1] ?? url;
    if (!specifier || (url && (url.startsWith('//') || urlSchemeMatcher.test(url)))) continue;
    imports.push(`import _$${index++} from '${specifier}';`);
  }

  return imports.join('\n');
};

export default compiler;
