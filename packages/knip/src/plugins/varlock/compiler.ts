const pluginMatcher = /^\s*#\s*@plugin\(\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^)'"\r\n]+?))\s*\)/gm;
const packageNameMatcher = /^(?:@[a-z\d][a-z\d._-]*\/)?[a-z\d][a-z\d._-]*$/;

const compiler = (text: string) => {
  if (!text.includes('@plugin')) return '';
  const imports = [];
  let match: RegExpExecArray | null;

  pluginMatcher.lastIndex = 0;
  while ((match = pluginMatcher.exec(text))) {
    const descriptor = (match[1] ?? match[2] ?? match[3])?.trim();
    if (!descriptor || descriptor.includes(':')) continue;
    if (descriptor.startsWith('./') || descriptor.startsWith('../') || descriptor.startsWith('/')) {
      imports.push(`import ${JSON.stringify(descriptor)};`);
      continue;
    }

    const versionSeparator = descriptor.indexOf('@', 1);
    const packageName = versionSeparator === -1 ? descriptor : descriptor.slice(0, versionSeparator);
    if ((versionSeparator !== -1 && !descriptor.slice(versionSeparator + 1)) || !packageNameMatcher.test(packageName)) {
      continue;
    }
    imports.push(`import ${JSON.stringify(packageName)};`);
  }

  return imports.join('\n');
};

export default compiler;
