import pc from 'picocolors';
import { defineMdastPlugin } from 'satteri';

const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const rewrite = (url: string) => url.replace(/(?:\/index)?\.mdx?(#.+)?$/, '$1');

const log = (from: string, to: string) => {
  console.log(`${pc.dim(dateTimeFormat.format(new Date()))} ${pc.cyan('[fix-link]')} Modify ${from} → ${to}`);
};

export const fixInternalLinks = defineMdastPlugin({
  name: 'fix-internal-links',
  link(node, ctx) {
    if (node.url.startsWith('.')) {
      const next = rewrite(node.url);
      ctx.setProperty(node, 'url', next);
      log(node.url, next);
    }
  },
  definition(node, ctx) {
    if (node.url.startsWith('.')) {
      const next = rewrite(node.url);
      ctx.setProperty(node, 'url', next);
      log(node.url, next);
    }
  },
});
