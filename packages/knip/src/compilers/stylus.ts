import { isScopedPackage, isTildePackage, splitSpec } from './shared.ts';
import type { CompilerSync } from './types.ts';

// https://stylus-lang.com/docs/import.html

const dependencies = ['stylus'];

const importMatcher =
  /"(?:\\(?:\r\n|[\s\S]|$)|[^"\\\r\n\f])*(?:"|[\r\n\f]|$)|'(?:\\(?:\r\n|[\s\S]|$)|[^'\\\r\n\f])*(?:'|[\r\n\f]|$)|\/\*[\s\S]*?(?:\*\/|$)|@(?:import|require)\s+['"]([^'"]+)['"]/g;

const candidates = (specifier: string): string[] => {
  const { dir, name } = splitSpec(specifier);
  if (name.endsWith('.styl') || name.endsWith('.stylus') || name.endsWith('.css')) return [`${dir}/${name}`];
  return [`${dir}/${name}.styl`, `${dir}/${name}/index.styl`];
};

export const compiler: CompilerSync = text => {
  if (!text.includes('@import') && !text.includes('@require')) return '';
  const out: string[] = [];
  let i = 0;
  let match: RegExpExecArray | null;
  importMatcher.lastIndex = 0;
  while ((match = importMatcher.exec(text))) {
    let spec = match[1];
    if (!spec || spec.includes('*')) continue;
    let isBare = isScopedPackage(spec);
    if (isTildePackage(spec)) {
      spec = spec.slice(1);
      isBare = true;
    }
    if (isBare) {
      out.push(`import _$${i++} from '${spec}';`);
    } else {
      for (const s of candidates(spec)) out.push(`import _$${i++} from '${s}';`);
    }
  }
  return out.join('\n');
};

export default { dependencies, compiler };
