import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVarlockFile } from '../../src/plugins/varlock/parse.ts';

test('Parse Varlock root directives', () => {
  const source = `# documentation
# @currentEnv=$APP_ENV
# @plugin(package@1.0.0) # trailing comment
# @import(
#   ./.env.shared,
#   enabled=false,
# )

APP_ENV=production
`;
  const { directives, disabled } = parseVarlockFile(source);

  assert.equal(disabled, false);
  assert.deepEqual(directives, [
    { name: 'plugin', descriptor: 'package@1.0.0' },
    { name: 'import', descriptor: './.env.shared', enabled: false },
  ]);
});

test('Ignore directives outside the header and detect disabled files', () => {
  const source = `# @disable
# @plugin(active-plugin)

VALUE=
# @plugin(item-plugin)
`;
  const { directives, disabled } = parseVarlockFile(source);

  assert.equal(disabled, true);
  assert.deepEqual(
    directives.map(directive => directive.descriptor),
    ['active-plugin']
  );
});

test('Ignore decorators attached to the first item', () => {
  const source = `# @plugin(root-plugin)
# ---
# @plugin(item-plugin)
VALUE=
`;

  const { directives } = parseVarlockFile(source);

  assert.deepEqual(directives, [{ name: 'plugin', descriptor: 'root-plugin' }]);
});

test('Parse files with a UTF-8 BOM and indented comments', () => {
  const source = `\uFEFF  # @plugin(indented-plugin)

VALUE=
`;

  const { directives } = parseVarlockFile(source);

  assert.deepEqual(directives, [{ name: 'plugin', descriptor: 'indented-plugin' }]);
});

test('Preserve dynamic directive options', () => {
  const source = `# @import(./conditional.env, enabled=forEnv(production))

VALUE=
`;

  const { directives } = parseVarlockFile(source);

  assert.deepEqual(directives, [{ name: 'import', descriptor: './conditional.env', enabled: null }]);
});

test('Parse nested expressions and quoted delimiters', () => {
  const source = `# @plugin("./plugins/a,@b#c.js") @import(
#   './.env.shared',
#   enabled=eq(fallback($APP_ENV, development), production),
#   allowMissing=true,
# ) # @plugin(ignored-plugin)

VALUE=
`;

  const { directives } = parseVarlockFile(source);

  assert.deepEqual(directives, [
    { name: 'plugin', descriptor: './plugins/a,@b#c.js' },
    { name: 'import', descriptor: './.env.shared', enabled: null, allowMissing: true },
  ]);
});

test('Keep valid directives when a later directive is malformed', () => {
  const source = `# @plugin(valid-plugin)
# @import(./.env.broken

VALUE=
`;

  const { directives } = parseVarlockFile(source);

  assert.deepEqual(directives, [{ name: 'plugin', descriptor: 'valid-plugin' }]);
});

test('Ignore dynamic descriptors and non-boolean option literals', () => {
  const source = `# @plugin(resolvePlugin(production))
# @import(./.env.shared, enabled="false", allowMissing=$ALLOW_MISSING)

VALUE=
`;

  const { directives } = parseVarlockFile(source);

  assert.deepEqual(directives, [{ name: 'import', descriptor: './.env.shared', enabled: null, allowMissing: null }]);
});

test('Parse static scalar descriptors strictly', () => {
  const source = `# @plugin('plugin\\'s.js')
# @plugin("a" + "b")
# @plugin(foo bar)
# @plugin(01)
# @plugin(-0)

VALUE=
`;

  const { directives } = parseVarlockFile(source);

  assert.deepEqual(
    directives.map(directive => directive.descriptor),
    ["plugin's.js", '01', '-0']
  );
});
