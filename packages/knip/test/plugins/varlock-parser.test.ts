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
  const { directives, disabled, environmentKey, staticValues } = parseVarlockFile(source);

  assert.equal(disabled, false);
  assert.equal(environmentKey, 'APP_ENV');
  assert.deepEqual(directives, [
    { name: 'plugin', descriptor: 'package@1.0.0' },
    { name: 'import', descriptor: './.env.shared', enabled: false },
  ]);
  assert.equal(staticValues.get(environmentKey), 'production');
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
