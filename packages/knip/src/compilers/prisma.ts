import type { HasDependency } from './types.js';

const condition = (hasDependency: HasDependency) => hasDependency('prisma');

const directiveMatcher = /generator\s+(?!client)\w+\s*\{\s*provider\s*=\s*"([^"]+)"[^}]*\}/g;

const compiler = (text: string) => {
  const imports = [];
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop pattern
  while ((match = directiveMatcher.exec(text))) {
    if (match[1]) {
      imports.push(`import '${match[1]}';`);
    }
  }

  return imports.join('\n');
};

export default { condition, compiler };
