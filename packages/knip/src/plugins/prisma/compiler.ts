const directiveMatcher = /generator\s+(?!client)\w+\s*\{\s*provider\s*=\s*"([^"]+)"[^}]*\}/g;

const compiler = (text: string) => {
  if (!text.includes('generator')) return '';
  const imports = [];
  let match: RegExpExecArray | null;

  directiveMatcher.lastIndex = 0;
  while ((match = directiveMatcher.exec(text))) {
    if (match[1]) {
      imports.push(`import '${match[1]}';`);
    }
  }

  return imports.join('\n');
};

export default compiler;
