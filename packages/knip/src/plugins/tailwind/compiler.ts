import { getUrlSpecifier } from '../../compilers/shared.ts';
import { hasUrlScheme } from '../../util/url.ts';

const directiveMatcher =
  /"(?:\\(?:\r\n|[\s\S]|$)|[^"\\\r\n\f])*(?:"|[\r\n\f]|$)|'(?:\\(?:\r\n|[\s\S]|$)|[^'\\\r\n\f])*(?:'|[\r\n\f]|$)|\/\*[\s\S]*?(?:\*\/|$)|@(?:(?:import|config|plugin|reference)\s+['"]([^'"]+)['"]|import\s+url\(\s*(?:['"]([^'"]+)['"]|([^'")\s]+))\s*\))[^;]*;|url\(\s*(?:["']([^"'\r\n]*)["']|([^'")\s]+))\s*\)/g;

const compiler = (text: string) => {
  if (
    !text.includes('@import') &&
    !text.includes('@config') &&
    !text.includes('@plugin') &&
    !text.includes('@reference') &&
    !text.includes('url(')
  )
    return '';
  const imports = [];
  let match: RegExpExecArray | null;
  let index = 0;

  directiveMatcher.lastIndex = 0;
  while ((match = directiveMatcher.exec(text))) {
    const asset = match[4] ?? match[5];
    if (asset !== undefined) {
      const specifier = getUrlSpecifier(asset);
      if (specifier) imports.push(`import _$${index++} from '${specifier}';`);
      continue;
    }
    const url = match[2] ?? match[3];
    const specifier = match[1] ?? url;
    if (!specifier || (url && (url.startsWith('//') || hasUrlScheme(url)))) continue;
    imports.push(`import _$${index++} from '${specifier}';`);
  }

  return imports.join('\n');
};

export default compiler;
