import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDescriptor,
  getOption,
  getStaticEnvValue,
  parseVarlockDirectives,
} from '../../src/plugins/varlock/parse.ts';

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
  const { directives, disabled, environmentKey } = parseVarlockDirectives(source);

  assert.equal(disabled, false);
  assert.equal(environmentKey, 'APP_ENV');
  assert.equal(getDescriptor(directives[0].args), 'package@1.0.0');
  assert.equal(getDescriptor(directives[1].args), './.env.shared');
  assert.equal(getOption(directives[1].args, 'enabled'), 'false');
  assert.equal(getStaticEnvValue(source, environmentKey), 'production');
});

test('Ignore directives outside the header and detect disabled files', () => {
  const source = `# @disable
# @plugin(active-plugin)

VALUE=
# @plugin(item-plugin)
`;
  const { directives, disabled } = parseVarlockDirectives(source);

  assert.equal(disabled, true);
  assert.deepEqual(
    directives.map(directive => getDescriptor(directive.args)),
    ['active-plugin']
  );
});
