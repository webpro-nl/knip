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
