import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { parseCodeowners } from '../../src/util/codeowners.js';

test('codeowners', () => {
  const content = `
# Global owner as fallback
*       @global-owner

# File extensions
*.js    @js-owner
*.ts    @ts-owner

# Directory patterns
/docs/          @docs-team
/src/lib/       @lib-team
/apps/web/      @web-team
**/tests/       @test-team

# Specific files take precedence
/src/lib/core.js    @core-team
  `.trim();

  const findOwners = parseCodeowners(content);

  assert.deepEqual(findOwners('README.md'), ['@global-owner']);
  assert.deepEqual(findOwners('utils.js'), ['@js-owner']);
  assert.deepEqual(findOwners('src/types.ts'), ['@ts-owner']);
  assert.deepEqual(findOwners('docs/api.md'), ['@docs-team']);
  assert.deepEqual(findOwners('src/lib/utils.js'), ['@lib-team']);
  assert.deepEqual(findOwners('src/lib/core.js'), ['@core-team']);
  assert.deepEqual(findOwners('apps/web/index.js'), ['@web-team']);
  assert.deepEqual(findOwners('src/tests/unit.js'), ['@test-team']);
});

test('codeowners pattern matching', () => {
  const content = `
# Shallow match with /* (should not match deeply nested files)
/docs/*      @docs-shallow
# Deep match (should match all nested files)
/api/        @api-deep
  `.trim();

  const findOwners = parseCodeowners(content);

  assert.deepEqual(findOwners('docs/readme.md'), ['@docs-shallow']);

  assert.deepEqual(findOwners('docs/guides/start.md'), []);

  assert.deepEqual(findOwners('api/endpoint.js'), ['@api-deep']);
  assert.deepEqual(findOwners('api/v1/users.js'), ['@api-deep']);
});

test('codeowners with multiple owners', () => {
  const content = `
*.js    @js-owner

/src/   @lead-dev @senior-dev @architect
/docs/  @tech-writer @docs-team docs@example.com

/api/   @backend-team api@company.com @devops-team
  `.trim();

  const findOwners = parseCodeowners(content);

  assert.deepEqual(findOwners('utils.js'), ['@js-owner']);
  assert.deepEqual(findOwners('src/app.ts'), ['@lead-dev', '@senior-dev', '@architect']);
  assert.deepEqual(findOwners('docs/api.md'), ['@tech-writer', '@docs-team', 'docs@example.com']);
  assert.deepEqual(findOwners('api/users.js'), ['@backend-team', 'api@company.com', '@devops-team']);
});

test('codeowners pattern precedence', () => {
  const content = `
/src/lib/ @first-owner
/src/lib/ @second-owner
  `.trim();

  const findOwners = parseCodeowners(content);
  assert.deepEqual(findOwners('src/lib/file.js'), ['@second-owner']);
});

test('codeowners ownership resolution', () => {
  const content = `
/is/not-owned  @some/owner
/is/owned      @some/other-owner
  `.trim();

  const findOwners = parseCodeowners(content);

  assert.deepEqual(findOwners('is/not-owned'), ['@some/owner']);
  assert.deepEqual(findOwners('is/owned'), ['@some/other-owner']);
});

test('codeowners file resolution', () => {
  const content = '/src/ @team';
  const findOwners = parseCodeowners(content);

  const paths = ['src/file1.js', 'src/file2.js', 'src/nested/file3.js'];
  const results = paths.map(path => ({ path, owners: findOwners(path) }));

  assert(results.every(r => r.owners[0] === '@team'));
});
