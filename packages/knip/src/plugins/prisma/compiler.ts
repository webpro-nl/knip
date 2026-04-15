const directiveMatcher = /generator\s+(?!client)\w+\s*\{\s*provider\s*=\s*"([^"]+)"[^}]*\}/g;

const compiler = (text: string) => {
  const imports = [];
  let match: RegExpExecArray | null;

  // oxlint-disable-next-line no-cond-assign
  while ((match = directiveMatcher.exec(text))) {
    if (match[1]) {
      imports.push(`import '${match[1]}';`);
    }
  }

  return imports.join('\n');
};

export default compiler;
