import type { HasDependency } from './types.js';

const condition = (hasDependency: HasDependency) => hasDependency('tailwindcss');

const directiveMatcher = /@(?:import|config|source|plugin)\s+['"]([^'"]+)['"][^;]*;/g;

const compiler = (text: string) => {
  const imports = [];
  let match: RegExpExecArray | null;
  let index = 0;

  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop pattern
  while ((match = directiveMatcher.exec(text))) if (match[1]) imports.push(`import _$${index++} from '${match[1]}';`);

  return imports.join('\n');
};

export default { condition, compiler };
