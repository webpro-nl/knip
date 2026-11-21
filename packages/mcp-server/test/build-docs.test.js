import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { buildDocs } from '../scripts/build-docs.js';

const docs = buildDocs(fileURLToPath(new URL('./fixtures/build-docs', import.meta.url)));

/** @param {string} id @param {string} anchor */
const section = (id, anchor) => {
  const [start, end] = docs[id].sections[anchor];
  return docs[id].content.slice(start, end);
};

test('builds a page per docs file by its path on the site, without the blog', () => {
  assert.deepEqual(Object.keys(docs), ['other', 'page', 'reference/cli', 'writing-a-plugin']);
});

test('inlines reference links and rewrites doc links to topic paths', () => {
  assert.equal(section('page', 'one-sub'), '### One `sub`?\n\nTo [other](other#two) and [plugin](writing-a-plugin).');
  assert.match(
    docs.page.content,
    /^See \[two\]\(other\), \[`--workspace \[filter\]`\]\(reference\/cli#--workspace-filter\) and \[Self\]\(#one\)\.$/m
  );
  assert.match(docs.page.content, /^\[!\[alt\]\(\/image\.svg\)\]\(https:\/\/example\.com\)$/m);
  assert.match(
    docs.page.content,
    /^Intro with \[external\]\(https:\/\/knip\.dev\) and \[site\]\(\/reference\/cli\)\.$/m
  );
  assert.doesNotMatch(docs.page.content, /^\[[^\]]+\]:/m);
});

test('turns asides into a label, link directives into links, and unwraps other directives', () => {
  assert.equal(
    section('page', 'one-1'),
    '## One\n\n**Tip**\n\nTip content.\n\n**Custom label**\n\nNote content.\n\nUnwrapped.\n\n[Sponsored by:](/sponsors) and text'
  );
});

test('drops MDX imports, expressions and empty components, and labels tabs and cards', () => {
  assert.equal(
    docs.other.content,
    '## Two\n\n**npm**\n\n```shell\nnpm install\n```\n\n**Card title**\n\nCard content.\n'
  );
});

test('records sections up to the next heading of the same or a higher level, with anchors as on the site', () => {
  assert.deepEqual(Object.keys(docs.page.sections), ['one', 'one-sub', 'one-1']);
  assert.match(section('page', 'one'), /^## One\n\nSee [\s\S]+### One `sub`\?[\s\S]+\(writing-a-plugin\)\.$/);
  assert.deepEqual(Object.keys(docs['reference/cli'].sections), ['--workspace-filter']);
  assert.ok(docs.page.content.endsWith(' and text\n'));
});

test('builds the docs package to plain Markdown with resolvable internal links', () => {
  const pages = buildDocs();
  assert.ok(Object.keys(pages).length > 200);
  assert.ok(!Object.keys(pages).some(id => id.startsWith('blog/')));

  const parse = unified().use(remarkParse).use(remarkGfm);
  const references = new Set(['definition', 'linkReference', 'imageReference']);
  for (const [id, page] of Object.entries(pages)) {
    /** @param {any} node */
    const check = node => {
      assert.ok(!references.has(node.type), `${id}: ${node.type} left`);
      if (node.type === 'html') assert.doesNotMatch(node.value, /<\/?[A-Z]/, `${id}: JSX left`);
      if (node.type === 'paragraph')
        assert.doesNotMatch(node.children[0]?.value ?? '', /^(?:import|export) |^:::/, `${id}: MDX left`);
      if (node.type === 'link' && !/^(?:[a-z]+:|\/)/.test(node.url)) {
        const [target, anchor] = node.url.startsWith('#') ? [id, node.url.slice(1)] : node.url.split('#');
        assert.ok(pages[target], `${id}: no page for ${node.url}`);
        if (anchor) assert.ok(anchor in pages[target].sections, `${id}: no section for ${node.url}`);
      }
      for (const child of node.children ?? []) check(child);
    };
    check(parse.parse(page.content));
  }
});
