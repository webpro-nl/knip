import assert from 'node:assert/strict';
import { register } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import descriptors from './fixtures/contention-descriptors.js';
import { Uri } from './vscode-stub.js';

register('./vscode-stub-hooks.js', import.meta.url);

const { ExportsTreeViewProvider } = await import('../src/tree-view-exports.js');

const ROOT = '/workspace';
const providerFor = (fileName, file = descriptors[fileName]) => {
  const provider = new ExportsTreeViewProvider();
  provider.kind = 'file';
  provider.currentUri = Uri.file(path.join(ROOT, fileName));
  provider.workspaceRoot = ROOT;
  provider.file = file;
  return provider;
};

const toPlain = item => {
  const children = [];
  for (const child of item._children ?? []) children.push(toPlain(child));
  const command = item.command;
  return {
    label: item.label,
    description: item.description,
    tooltip: item.tooltip,
    command: command && {
      command: command.command,
      target: path.relative(ROOT, command.arguments[0].fsPath),
      line: command.arguments[1],
      col: command.arguments[2],
    },
    children,
  };
};

const render = (fileName, file) => {
  const rows = [];
  for (const item of providerFor(fileName, file).getChildren()) rows.push(toPlain(item));
  return rows;
};

const goTo = (target, line, col) => ({ command: 'knip.goToPosition', target, line, col });
const open = target => ({ command: 'vscode.open', target, line: undefined, col: undefined });
const row = (label, description, tooltip, command, children = []) => ({
  label,
  description,
  tooltip,
  command,
  children,
});

const importRow = row('→', 'index.ts', 'Go to usage or contention location', goTo('index.ts', 0, 33));

const competing = name => [
  row('‼︎', 'fruits.ts', `Competing binding: ${name}`, goTo('fruits.ts', 0, 13)),
  row('‼︎', 'vegetables.ts', `Competing binding: ${name}`, goTo('vegetables.ts', 0, 13)),
];

test('an ambiguous export groups its competing origins under each site', () => {
  const [apple] = render('fruits.ts');
  assert.equal(apple.label, 'apple');
  assert.equal(apple.description, '► imported 1x / ambiguous 2x at barrel.ts');
  assert.equal(apple.tooltip, 'Go to export location');
  assert.deepEqual(apple.command, goTo('fruits.ts', 0, 13));
  assert.deepEqual(apple.children, [
    importRow,
    row(
      '‼︎',
      'barrel.ts',
      'Ambiguous at barrel.ts: apple resolves to 2 bindings',
      open('barrel.ts'),
      competing('apple')
    ),
    row(
      '‼︎',
      'type-barrel.ts',
      'Ambiguous at type-barrel.ts: apple resolves to 2 bindings',
      open('type-barrel.ts'),
      competing('apple')
    ),
    row(
      '⊘',
      'explicit-barrel.ts',
      'Shadowing at explicit-barrel.ts: apple hides 1 binding',
      goTo('explicit-barrel.ts', 1, 9),
      [
        row('⊘', 'fruits.ts', 'Hidden binding: apple', goTo('fruits.ts', 0, 13)),
        row('✓', 'orchard.ts', 'Winning binding: apple', goTo('orchard.ts', 0, 13)),
      ]
    ),
  ]);
});

test('a site on the described file itself groups its origins', () => {
  const [apple] = render('barrel.ts');
  assert.equal(apple.description, '► imported 1x / ambiguous');
  assert.deepEqual(apple.children, [
    importRow,
    row(
      '‼︎',
      'barrel.ts',
      'Ambiguous at barrel.ts: apple resolves to 2 bindings',
      open('barrel.ts'),
      competing('apple')
    ),
  ]);
});

test('a shadowed site marks the winning binding and lists the hidden one', () => {
  const [cherry] = render('grove.ts');
  assert.equal(cherry.description, '► imported 0x / shadowing at explicit-barrel.ts');
  assert.deepEqual(cherry.children, [
    row(
      '⊘',
      'explicit-barrel.ts',
      'Shadowing at explicit-barrel.ts: cherry hides 1 binding',
      goTo('explicit-barrel.ts', 1, 9),
      [
        row('⊘', 'grove.ts', 'Hidden binding: cherry', goTo('grove.ts', 0, 13)),
        row('✓', 'orchard.ts', 'Winning binding: cherry', goTo('orchard.ts', 0, 13)),
      ]
    ),
  ]);
});

test('a winning declaration describes shadowing without calling itself shadowed', () => {
  const file = structuredClone(descriptors['grove.ts']);
  file.exports[0].filePath = '/workspace/orchard.ts';
  const [cherry] = render('orchard.ts', file);
  assert.equal(cherry.description, '► imported 0x / shadowing at explicit-barrel.ts');
  assert.equal(cherry.children[0].tooltip, 'Shadowing at explicit-barrel.ts: cherry hides 1 binding');
});

test('a converged site names the paths the binding arrives through', () => {
  const [diamond] = render('diamond-base.ts');
  assert.equal(diamond.description, '► imported 0x / converged at diamond-top.ts');
  assert.deepEqual(diamond.children, [
    row(
      '◇',
      'diamond-top.ts',
      'Converged at diamond-top.ts: DIAMOND arrives through diamond-left.ts, diamond-right.ts',
      open('diamond-top.ts'),
      [row('◇', 'diamond-base.ts', 'Origin binding: DIAMOND', goTo('diamond-base.ts', 0, 13))]
    ),
  ]);
});

test('the open converging barrel keeps the site and its source paths', () => {
  const file = structuredClone(descriptors['diamond-base.ts']);
  file.exports[0].filePath = '/workspace/diamond-top.ts';
  const [diamond] = render('diamond-top.ts', file);
  assert.equal(diamond.description, '► imported 0x / converged');
  assert.deepEqual(diamond.children, [
    row(
      '◇',
      'diamond-top.ts',
      'Converged at diamond-top.ts: DIAMOND arrives through diamond-left.ts, diamond-right.ts',
      open('diamond-top.ts'),
      [row('◇', 'diamond-base.ts', 'Origin binding: DIAMOND', goTo('diamond-base.ts', 0, 13))]
    ),
  ]);
});

test('a source outside the workspace keeps its specifier instead of escaping the root', () => {
  const [compote] = render('compote.ts');
  assert.equal(compote.description, '► imported 0x / converged at preserves.ts');
  assert.deepEqual(compote.children, [
    row(
      '◇',
      'preserves.ts',
      'Converged at preserves.ts: compote arrives through lodash, compote.ts',
      open('preserves.ts'),
      [row('◇', 'compote.ts', 'Origin binding: compote', goTo('compote.ts', 0, 13))]
    ),
  ]);
});

test('an origin without a position opens its file', () => {
  const [produce] = render('namespace-barrel.ts');
  assert.equal(produce.description, '► imported 0x / ambiguous');
  assert.deepEqual(produce.children, [
    row(
      '‼︎',
      'namespace-barrel.ts',
      'Ambiguous at namespace-barrel.ts: produce resolves to 2 bindings',
      open('namespace-barrel.ts'),
      [
        row('‼︎', 'grove.ts', 'Competing binding: produce', goTo('grove.ts', 0, 13)),
        row('‼︎', 'orchard.ts', 'Competing binding: *', open('orchard.ts')),
      ]
    ),
  ]);
});

test('an origin at a package specifier renders as a label without a command', () => {
  const [merge] = render('pantry.ts');
  assert.equal(merge.description, '► imported 0x / ambiguous');
  assert.deepEqual(merge.children, [
    row('‼︎', 'pantry.ts', 'Ambiguous at pantry.ts: merge resolves to 2 bindings', open('pantry.ts'), [
      row('lodash:merge', undefined, 'Competing binding: merge', undefined),
      row('‼︎', 'utils.ts', 'Competing binding: merge', goTo('utils.ts', 2, 13)),
    ]),
  ]);
});

test('details without usable sites degrade to the legacy rendering', () => {
  const [jam, syrup] = render('cellar.ts');
  assert.equal(jam.description, '► imported 0x / contention 1x');
  assert.deepEqual(jam.children, [row('◇', 'crate.ts', 'Contention: branch location', open('crate.ts'))]);
  assert.equal(syrup.description, '► imported 0x / contention 3x');
  assert.deepEqual(syrup.children, [
    row('◇', 'crate.ts', 'Contention: branch location', open('crate.ts')),
    row('‼︎', 'grove.ts', 'Contention: conflict location', open('grove.ts')),
    row('‼︎', 'orchard.ts', 'Contention: conflict location', open('orchard.ts')),
  ]);
});

test('an unknown kind falls back to a neutral icon, role and tooltip', () => {
  const [kimchi] = render('ferment.ts');
  assert.equal(kimchi.description, '► imported 0x / fermented at crock.ts');
  assert.deepEqual(kimchi.children, [
    row('►', 'crock.ts', 'Contention at crock.ts: kimchi', goTo('crock.ts', 2, 13), [
      row('►', 'brine.ts', 'Origin binding: kimchi', goTo('brine.ts', 0, 13)),
    ]),
  ]);
});

test('no contention row repeats within the group it is listed under', () => {
  const key = ({ label, filePath, line, col, icon, tooltip }) => [label, filePath, line, col, icon, tooltip].join('\0');
  let groups = 0;
  let rows = 0;
  /** @param {{ children?: unknown[] }[]} siblings */
  const assertUnique = (siblings, where) => {
    groups++;
    rows += siblings.length;
    assert.equal(new Set(siblings.map(key)).size, siblings.length, `repeated row under ${where}`);
    for (const sibling of siblings) if (sibling.children) assertUnique(sibling.children, `${where} > ${key(sibling)}`);
  };
  for (const fileName of Object.keys(descriptors)) {
    const provider = providerFor(fileName);
    for (const [identifier, details] of Object.entries(descriptors[fileName].contention)) {
      assertUnique(provider.createContentionDescriptors(details), `${fileName}:${identifier}`);
    }
  }
  assert.equal(groups, 20);
  assert.equal(rows, 31);
});
