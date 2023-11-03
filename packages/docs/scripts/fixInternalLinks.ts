import { bold, cyan, dim } from 'kleur/colors';
import { visit, type Visitor } from 'unist-util-visit';

const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export const fixInternalLinks = () => tree => {
  const visitor: Visitor = node => {
    if ((node.type === 'link' || node.type === 'definition') && node.url.startsWith('.')) {
      const url = node.url;
      node.url = url
        .replace(/^(\.\/|\.\.\/)/, (match: string) => (match === './' ? '../' : '../../'))
        .replace(/\.mdx?(#.+)?$/, '/$1');
      console.log(`${dim(dateTimeFormat.format(new Date()))} ${bold(cyan('[fix-link]'))} Modify ${url} → ${node.url}`);
    }
  };
  visit(tree, visitor);
};
