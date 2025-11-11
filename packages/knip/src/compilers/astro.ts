import type { Node } from '@astrojs/compiler/types';
import type { HasDependency } from './types.js';
import { is } from '@astrojs/compiler/utils';
import { parse } from '@astrojs/compiler';

const condition = (hasDependency: HasDependency) => hasDependency('astro');

const compiler = async (text: string) => {
  const detected: string[] = [];

  const traverse = (parent: Node) => {
    if (is.frontmatter(parent)) {
      detected.push(parent.value);
    }

    if (is.tag(parent) && parent.name === 'script') {
      const scriptSrc = parent?.attributes?.find(attribute => attribute.name === 'src')?.value;
      if (scriptSrc) {
        const isExternalScript = scriptSrc.startsWith('http') || scriptSrc.startsWith('/'); // a script starting with `/` is considered external, in the sense that it's fetched over the network at runtime. However Astro does support putting scripts into a `public` dir and then consuming them at `/`, so you could argue that's an import. The risk of false positives is high, though, since scripts other than those at `public/` might be available at `/`.
        if (!isExternalScript) {
          detected.push(`import ${JSON.stringify(scriptSrc)};`);
        }
      } else {
        const scriptText = parent?.children.filter(child => child.type === 'text').map(child => child.value);
        detected.push(...scriptText);
      }
    } else if ('children' in parent) {
      return parent.children.forEach(child => traverse(child));
    }
  };

  const parseResult = await parse(text);

  traverse(parseResult.ast);

  const compiled = [...detected].join('\n');

  return compiled;
};

export default { condition, compiler };
