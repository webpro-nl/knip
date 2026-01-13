import { frontmatterMatcher, scriptBodies } from './compilers.js';
import type { HasDependency } from './types.js';

const condition = (hasDependency: HasDependency) => hasDependency('astro');

const compiler = (text: string, path: string) => {
  const scripts = [];

  const frontmatter = text.match(frontmatterMatcher);
  if (frontmatter?.[1]) scripts.push(frontmatter[1]);

  const scriptContent = scriptBodies(text, path);
  if (scriptContent) scripts.push(scriptContent);

  return scripts.join('\n');
};

export default { condition, compiler };
