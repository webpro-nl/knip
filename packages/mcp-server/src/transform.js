import { posix } from 'node:path';

const DOC_LINK = /\.(md|mdx)(#.*)?$/;
const ASIDE = /^:::(tip|note|caution|danger|warning)(?:\[([^\]]*)\])?\s*$/;
const FENCE = /^(\s*)(`{3,}|~{3,})/;
const ESM = /^(import|export)\b/;
const TAB_ITEM = /^\s*<TabItem\s+[^>]*label=["']([^"']+)["'][^>]*>\s*$/;
const TAG_LINE = /^\s*<\/?[A-Za-z][\w.-]*(?:\s[^<>]*)?\/?>\s*$/;

/**
 * Rewrite a relative doc link into a knip-docs topic path, so an agent can pass
 * it straight back to the `knip-docs` tool. Leaves external/anchor/site links as-is.
 * e.g. `../reference/integrations.md#filters` on a `guides/` page → `reference/integrations#filters`
 * @param {string} target
 * @param {string} dir
 * @returns {string}
 */
function rewriteLink(target, dir) {
  if (/^(https?:|mailto:|tel:|#|\/)/.test(target)) return target;
  if (!DOC_LINK.test(target)) return target;
  const [path, anchor] = target.split('#');
  const resolved = posix.normalize(posix.join(dir, path)).replace(/\.(md|mdx)$/, '');
  return anchor ? `${resolved}#${anchor}` : resolved;
}

/**
 * Make a doc page self-contained for an agent reading it cold via MCP: strip
 * frontmatter and MDX import/export statements, flatten `<Tabs>`/`<TabItem>` and
 * Starlight asides to plain markdown, drop remaining standalone JSX/HTML tags,
 * and rewrite relative doc links to `knip-docs` topic paths. Code fences are left
 * untouched (incl. nested longer fences).
 * @param {string} content
 * @param {string} filePath relative path under the docs dir, e.g. `guides/handling-issues.mdx`
 * @returns {string}
 */
export function transformForAgent(content, filePath) {
  const dir = posix.dirname(filePath);
  const body = content.replace(/^---[\s\S]*?---\n/, '');
  const out = [];
  let fence = null;
  let inEsm = false;
  let esmDepth = 0;

  for (const line of body.split('\n')) {
    const f = line.match(FENCE);
    if (f) {
      const marker = f[2];
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      out.push(line);
      continue;
    }
    if (fence) {
      out.push(line);
      continue;
    }

    // Drop MDX import/export statements, balancing braces to span multi-line ones
    if (!inEsm && ESM.test(line)) inEsm = true;
    if (inEsm) {
      for (const ch of line) {
        if (ch === '{') esmDepth++;
        else if (ch === '}') esmDepth--;
      }
      if (esmDepth <= 0) {
        inEsm = false;
        esmDepth = 0;
      }
      continue;
    }

    const tab = line.match(TAB_ITEM);
    const aside = line.match(ASIDE);
    if (tab) {
      out.push(`**${tab[1]}**`);
    } else if (aside) {
      out.push(`**${aside[2] || aside[1][0].toUpperCase() + aside[1].slice(1)}**`);
    } else if (/^:::\s*$/.test(line) || TAG_LINE.test(line)) {
      // drop aside close and any standalone tag (<Tabs>, </TabItem>, <Card>, <video>, <source/>, …)
    } else {
      out.push(
        line
          .replace(/\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (_m, t, title) => `](${rewriteLink(t, dir)}${title || ''})`)
          .replace(/^(\[[^\]]+\]:\s+)(\S+)(.*)$/, (_m, pre, t, rest) => `${pre}${rewriteLink(t, dir)}${rest}`)
      );
    }
  }

  return out.join('\n');
}
