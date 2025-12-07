import type { HasDependency } from './types.js';

const condition = (hasDependency: HasDependency) =>
  hasDependency('sass') || hasDependency('sass-embedded') || hasDependency('node-sass');

const importMatcher = /@(?:use|import|forward)\s+['"](pkg:)?([^'"]+)['"]/g;

const toRelative = (specifier: string) => (specifier.startsWith('.') ? specifier : `./${specifier}`);

const compiler = (text: string) => {
  const imports = [];
  let match: RegExpExecArray | null;
  let index = 0;

  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop pattern
  while ((match = importMatcher.exec(text))) {
    if (match[2]) imports.push(`import _$${index++} from '${match[1] ? match[2] : toRelative(match[2])}';`);
  }

  return imports.join('\n');
};

export default { condition, compiler };
