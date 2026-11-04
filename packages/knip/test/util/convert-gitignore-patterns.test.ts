import assert from 'node:assert/strict';
import { EOL } from 'node:os';
import test from 'node:test';
import picomatch from 'picomatch';
import {
  convertGitignoreToPicomatchIgnorePatterns as convert,
  expandIgnorePatterns as expand,
  parseAndConvertGitignorePatterns as parse,
  toExtendedIgnorePattern as ext,
} from '../../src/util/parse-and-convert-gitignores.ts';

test('convertGitignoreToPicomatch', () => {
  assert.deepEqual(convert('*.ext'), { negated: false, pattern: '**/*.ext' });
  assert.deepEqual(convert('!*.ext'), { negated: true, pattern: '**/*.ext' });
  assert.deepEqual(convert('dir'), { negated: false, pattern: '**/dir' });
  assert.deepEqual(convert('dir/'), { negated: false, pattern: '**/dir' });
  assert.deepEqual(convert('.dot'), { negated: false, pattern: '**/.dot' });
  assert.deepEqual(convert('*.stars*'), { negated: false, pattern: '**/*.stars*' });
  assert.deepEqual(convert('!.ext'), { negated: true, pattern: '**/.ext' });
  assert.deepEqual(convert('file.ext'), { negated: false, pattern: '**/file.ext' });
  assert.deepEqual(convert('/root'), { negated: false, pattern: 'root' });
  assert.deepEqual(convert('/**/.dot/*'), { negated: false, pattern: '**/.dot/*' });
  assert.deepEqual(convert('!/**/.dot/dir'), { negated: true, pattern: '**/.dot/dir' });
  assert.deepEqual(convert('!/no-root'), { negated: true, pattern: 'no-root' });
  assert.deepEqual(convert('so/deep/dir'), { negated: false, pattern: 'so/deep/dir' });
  assert.deepEqual(convert('data/*'), { negated: false, pattern: 'data/*' });
  assert.deepEqual(convert('!lib/dist/'), { negated: true, pattern: 'lib/dist' });
  assert.deepEqual(convert('/**/root-star'), { negated: false, pattern: '**/root-star' });
  assert.deepEqual(convert('!**/dir/**/f.ext'), { negated: true, pattern: '**/dir/**/f.ext' });
});

test('convertGitignoreToPicomatch (middle slash anchors to .gitignore dir)', () => {
  const isIgnored = picomatch(expand([convert('data/*').pattern]));
  assert(isIgnored('data/runtime.json'));
  assert(isIgnored('data/nested/runtime.json'));
  assert(!isIgnored('src/data/consumer.ts'));
});

test('convertGitignoreToPicomatch (explicit wildcard directories)', () => {
  const pattern = '*/**/generated/*.ts';
  const isIgnored = picomatch(expand([convert(pattern).pattern]));
  assert(isIgnored('packages/ui/generated/types.ts'));
  assert(isIgnored('packages/generated/types.ts'));
  assert(!isIgnored('generated/types.ts'));
  assert(!isIgnored('packages/ui/src/types.ts'));
  assert.deepEqual(convert(`!${pattern}`), { negated: true, pattern });
});

test('toExtendedIgnorePattern', () => {
  assert.equal(ext('*'), '*');
  assert.equal(ext('**'), '**');
  assert.equal(ext('**/.dot/*'), '**/.dot/*/**');
  assert.equal(ext('**/.dot/*', true), '**/.dot/*');
  assert.equal(ext('**/dir'), '**/dir/**');
  assert.equal(ext('root'), 'root/**');
  assert.equal(ext('**/a/b/c'), '**/a/b/c/**');
});

test('expandIgnorePatterns', () => {
  const patterns = ['*', '**/dir', '**/.dot/*', 'dir/!(foo)'];
  const expanded = ['*', '**/dir', '**/dir/**', '**/.dot/*', '**/.dot/*/**', 'dir/!(foo)', 'dir/!(foo)/**'];
  assert.deepEqual(expand(patterns), expanded);
  assert.deepEqual(expand(['**/.dot/*'], true), ['**/.dot/*']);
  assert(picomatch(expand(['dir/!(foo)']))('dir/foobar.ts'));
});

test('parseAndConvertGitignorePatterns', async () => {
  const gitignorePatterns = ['.git', 'node_modules', 'a/b/c', '/a/b/c'];
  const globPatterns = parse(gitignorePatterns.join(EOL));
  assert.deepEqual(globPatterns, [
    { negated: false, pattern: '**/.git' },
    { negated: false, pattern: '**/node_modules' },
    { negated: false, pattern: 'a/b/c' },
    { negated: false, pattern: 'a/b/c' },
  ]);
});

test('parseAndConvertGitignorePatterns (ancestor)', async () => {
  const gitignorePatterns = ['.git', 'node_modules', 'a/b/c', '/a/b/c', '!a/b/d', 'data/*', '/root', '/**/deep'];
  const globPatterns = parse(gitignorePatterns.join(EOL), 'a/b/');
  assert.deepEqual(globPatterns, [
    { negated: false, pattern: '**/.git' },
    { negated: false, pattern: '**/node_modules' },
    { negated: false, pattern: 'c' },
    { negated: false, pattern: 'c' },
    { negated: true, pattern: 'd' },
    { negated: false, pattern: '**/deep' },
  ]);
});

test('parseAndConvertGitignorePatterns (root wildcard in ancestor)', () => {
  assert.deepEqual(parse('/*\n!/app/', 'app/'), []);
  assert.deepEqual(parse('/*\n!/*', 'app/'), []);
  assert.deepEqual(parse('/**\n!/app/', 'app/'), [{ negated: false, pattern: '**' }]);
  assert.deepEqual(parse('/*\n!/app/'), [
    { negated: false, pattern: '*' },
    { negated: true, pattern: 'app' },
  ]);
  assert.deepEqual(parse('*\n**\n!*.ts', 'app/'), [
    { negated: false, pattern: '*' },
    { negated: false, pattern: '**' },
    { negated: true, pattern: '**/*.ts' },
  ]);
});

test('parseAndConvertGitignorePatterns (explicit wildcard directories in ancestor)', () => {
  assert.deepEqual(parse('*/**/generated/*.ts\n!*/**/generated/keep.ts', 'packages/ui/'), [
    { negated: false, pattern: '**/generated/*.ts' },
    { negated: true, pattern: '**/generated/keep.ts' },
  ]);
});

test('parseAndConvertGitignorePatterns (hashes)', async () => {
  const gitignorePatterns = ['#comment', 'ends-with-hash#', String.raw`\#starts-with-hash`];
  const globPatterns = parse(gitignorePatterns.join(EOL));
  assert.deepEqual(globPatterns, [
    { negated: false, pattern: '**/ends-with-hash#' },
    { negated: false, pattern: '**/#starts-with-hash' },
  ]);
});
