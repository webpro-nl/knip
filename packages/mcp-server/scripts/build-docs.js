#!/usr/bin/env node
// Build the docs for the MCP server: each page of the docs package (except the blog) as Markdown
// for agents, with the offsets of its sections by heading anchor. Runs at pack time, so parsing
// stays out of the runtime: knip-docs only looks up a page and slices a section.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, posix, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import GithubSlugger from 'github-slugger';
import { definitions } from 'mdast-util-definitions';
import { toString } from 'mdast-util-to-string';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

/** @typedef {Record<string, { content: string, sections: Record<string, [number, number]> }>} Docs */

const DOCS_DIR = join(import.meta.dirname, '../../docs/src/content/docs');
const OUTPUT_FILE = join(import.meta.dirname, '../src/docs.json');

const ASIDES = new Set(['note', 'tip', 'caution', 'danger']);
const LABEL_ATTRIBUTES = { TabItem: 'label', Card: 'title' };

const markdown = unified().use(remarkParse).use(remarkGfm).use(remarkDirective);
const mdx = unified().use(remarkParse).use(remarkGfm).use(remarkDirective).use(remarkMdx);
const stringifier = unified().use(remarkStringify, { bullet: '-' }).use(remarkGfm);

/**
 * Page id of a docs file, as its path on the site (e.g. `writing-a-plugin/index.md` → `writing-a-plugin`)
 * @param {string} filePath relative to the docs dir, with forward slashes
 */
const toPageId = filePath => filePath.replace(/\.mdx?$/, '').replace(/(.)\/index$/, '$1');

/**
 * Rewrite a relative doc link to a page id with optional anchor, so an agent can pass it to knip-docs
 * @param {string} url
 * @param {string} dir directory of the page, relative to the docs dir
 */
const toTopic = (url, dir) => {
  if (/^(?:[a-z]+:|#|\/)/.test(url) || !/\.mdx?(?:#.*)?$/.test(url)) return url;
  const [path, anchor] = url.split('#');
  const id = toPageId(posix.normalize(posix.join(dir, path)));
  return anchor ? `${id}#${anchor}` : id;
};

/** @param {string} value */
const toLabel = value => ({ type: 'strong', children: [{ type: 'text', value }] });

/**
 * Turn MDX and directives into plain Markdown, inline reference links and rewrite doc links
 * @param {any} tree mdast root
 * @param {string} dir
 */
const toAgentTree = (tree, dir) => {
  const getDefinition = definitions(tree);

  /** @param {any} node @returns {any[]} */
  const transform = node => {
    const children = () => (node.children ?? []).flatMap(transform);
    switch (node.type) {
      case 'mdxjsEsm':
      case 'mdxFlowExpression':
      case 'mdxTextExpression':
      case 'definition':
        return [];
      case 'mdxJsxFlowElement':
      case 'mdxJsxTextElement': {
        const name = LABEL_ATTRIBUTES[node.name];
        const label = name && node.attributes.find(attribute => attribute.name === name)?.value;
        if (typeof label !== 'string') return children();
        return node.type === 'mdxJsxFlowElement'
          ? [{ type: 'paragraph', children: [toLabel(label)] }, ...children()]
          : [toLabel(label), ...children()];
      }
      case 'containerDirective': {
        const [first, ...rest] = node.children;
        const hasLabel = first?.data?.directiveLabel === true;
        const body = (hasLabel ? rest : node.children).flatMap(transform);
        if (!ASIDES.has(node.name)) return body;
        const name = `${node.name[0].toUpperCase()}${node.name.slice(1)}`;
        const label = hasLabel ? first.children.flatMap(transform) : [{ type: 'text', value: name }];
        return [{ type: 'paragraph', children: [{ type: 'strong', children: label }] }, ...body];
      }
      case 'leafDirective':
      case 'textDirective':
        // The site renders directives as HTML elements, e.g. `:a[text]{href="/sponsors"}`
        if (node.name === 'a' && node.attributes?.href)
          return [{ type: 'link', url: node.attributes.href, children: children() }];
        return children();
      case 'linkReference': {
        const definition = getDefinition(node.identifier);
        if (!definition) return children();
        return [{ type: 'link', url: toTopic(definition.url, dir), title: definition.title, children: children() }];
      }
      case 'imageReference': {
        const definition = getDefinition(node.identifier);
        if (!definition) return [{ type: 'text', value: node.alt ?? '' }];
        return [{ type: 'image', url: definition.url, title: definition.title, alt: node.alt }];
      }
      case 'link':
        return [{ ...node, url: toTopic(node.url, dir), children: children() }];
      default:
        return [node.children ? { ...node, children: children() } : node];
    }
  };

  return { type: 'root', children: tree.children.flatMap(transform) };
};

/**
 * Serialize a page per heading and record the offsets of each section: from its heading to the
 * next heading of the same or a higher level. Anchors follow the site: one github-slugger per page
 * over the text of every heading, in document order.
 * @param {any} tree mdast root
 */
const toPage = tree => {
  const slugger = new GithubSlugger();
  const slugs = new Map();
  /** @param {any} node */
  const collect = node => {
    if (node.type === 'heading') slugs.set(node, slugger.slug(toString(node, { includeImageAlt: false })));
    for (const child of node.children ?? []) collect(child);
  };
  collect(tree);

  /** @type {{ heading?: any, nodes: any[] }[]} */
  const chunks = [];
  for (const node of tree.children) {
    if (node.type === 'heading' || chunks.length === 0)
      chunks.push({ heading: node.type === 'heading' ? node : undefined, nodes: [] });
    chunks[chunks.length - 1].nodes.push(node);
  }

  let content = '';
  const starts = [];
  for (const chunk of chunks) {
    if (content) content += '\n\n';
    starts.push(content.length);
    content += stringifier.stringify({ type: 'root', children: chunk.nodes }).trimEnd();
  }

  /** @type {Record<string, [number, number]>} */
  const sections = {};
  chunks.forEach((chunk, index) => {
    if (!chunk.heading) return;
    const next = chunks.findIndex(
      (other, i) => i > index && other.heading && other.heading.depth <= chunk.heading.depth
    );
    sections[slugs.get(chunk.heading)] = [starts[index], next === -1 ? content.length : starts[next] - 2];
  });

  return { content: `${content}\n`, sections };
};

/**
 * @param {string} [docsDir]
 * @returns {Docs}
 */
export function buildDocs(docsDir = DOCS_DIR) {
  const files = readdirSync(docsDir, { recursive: true, encoding: 'utf-8' })
    .map(filePath => filePath.split(sep).join('/'))
    .filter(filePath => /\.mdx?$/.test(filePath) && !filePath.startsWith('blog/'))
    .sort();

  /** @type {Docs} */
  const docs = {};
  for (const filePath of files) {
    const source = readFileSync(join(docsDir, filePath), 'utf-8').replace(/^---\n[\s\S]*?\n---\n/, '');
    const tree = (filePath.endsWith('.mdx') ? mdx : markdown).parse(source);
    docs[toPageId(filePath)] = toPage(toAgentTree(tree, posix.dirname(filePath)));
  }
  return docs;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(OUTPUT_FILE, JSON.stringify(buildDocs()));
}
