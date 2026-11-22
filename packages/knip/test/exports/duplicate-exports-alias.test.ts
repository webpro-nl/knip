import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/exports/duplicate-exports-alias');

test('Ignore duplicate exports with @alias (JSDoc)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.duplicates['helpers.ts']['isUntagged|isUntaggedAlias']);
  assert(!issues.duplicates['helpers.ts']['reExportedValue|reExportedAlias']);
  assert(!issues.duplicates['specifier-default.ts'], 'export { X }; export default X should not be duplicate');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 5,
    duplicates: 11,
    processed: 23,
    total: 23,
  });
});

test('Report an alias of a default-only export as duplicate', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(issues.duplicates['default-alias.ts']?.['default|connectAlias']);
  assert(issues.duplicates['default-declaration-alias.ts']?.['default|openAlias']);
  assert(issues.duplicates['default-declaration-alias-before.ts']?.['launchAlias|default']);
  assert(issues.duplicates['default-specifier-alias.ts']?.['default|renderAlias']);
  assert(issues.duplicates['default-specifier-alias-before.ts']?.['paintAlias|default']);
  assert(issues.duplicates['default-specifier-alias-named-before.ts']?.['haltAlias|halt']);
  assert(
    !issues.duplicates['default-specifier-alias-tagged-before.ts'],
    'an @alias tag on the default export prevents the duplicate'
  );
  assert(
    !issues.duplicates['default-declaration-alias-tagged-before.ts'],
    'an @alias tag on the default export prevents the duplicate'
  );
  assert(issues.duplicates['default-alias-before.ts']?.['closeAlias|default|closeAliasAfter']);
  assert(!issues.duplicates['default-reexport-alias.ts'], 'an alias of a re-exported default is not a duplicate');
  assert(
    !issues.duplicates['default-reexport-alias-before.ts'],
    'an alias of a re-exported default is not a duplicate'
  );
  assert(!issues.duplicates['default-alias-tagged.ts'], 'an @alias tag on the default export prevents the duplicate');
  assert(
    !issues.duplicates['default-alias-tagged-before.ts'],
    'an @alias tag on the default export prevents the duplicate'
  );
});

test('Report an alias or a default export before the named export', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(issues.duplicates['named-alias-before.ts']?.['sendAlias|send']);
  assert(issues.duplicates['named-default-before.ts']?.['default|load']);
  assert(issues.duplicates['named-specifier-alias-before.ts']?.['saveAlias|save']);
  assert(!issues.duplicates['named-original-tagged.ts'], 'an @alias tag on the named export prevents the duplicate');
  assert(
    !issues.duplicates['named-original-tagged-before.ts'],
    'an @alias tag on the named export prevents the duplicate'
  );
});
