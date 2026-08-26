import assert from 'node:assert/strict';
import test from 'node:test';
import { compiler as lessCompiler } from '../../src/compilers/less.ts';
import { compiler as scssCompiler } from '../../src/compilers/scss.ts';
import { compiler as stylusCompiler } from '../../src/compilers/stylus.ts';
import type { CompilerSync } from '../../src/compilers/types.ts';
import tailwindCompiler from '../../src/plugins/tailwind/compiler.ts';

interface StyleCompilerCase {
  name: string;
  compiler: CompilerSync;
  path: string;
  directive: (specifier: string) => string;
  realSpecifier: string;
}

const compilers: StyleCompilerCase[] = [
  {
    name: 'SCSS',
    compiler: scssCompiler,
    path: 'styles.scss',
    directive: specifier => `@use "pkg:${specifier}";`,
    realSpecifier: 'real/*variant*/',
  },
  {
    name: 'Sass',
    compiler: scssCompiler,
    path: 'styles.sass',
    directive: specifier => `@use "pkg:${specifier}"`,
    realSpecifier: 'real/*variant*/',
  },
  {
    name: 'Less',
    compiler: lessCompiler,
    path: 'styles.less',
    directive: specifier => `@import "~${specifier}";`,
    realSpecifier: 'real/*variant*/',
  },
  {
    name: 'Stylus',
    compiler: stylusCompiler,
    path: 'styles.styl',
    directive: specifier => `@require "~${specifier}"`,
    realSpecifier: 'real',
  },
  {
    name: 'Tailwind CSS',
    compiler: tailwindCompiler,
    path: 'styles.css',
    directive: specifier => `@plugin "${specifier}";`,
    realSpecifier: 'real/*variant*/',
  },
];

test('Ignore stylesheet directives in block comments', () => {
  for (const { name, compiler, path, directive } of compilers) {
    const blockComments = `/* ${directive('closed-comment')} */
${directive('real')}
/* ${directive('open-comment')}`;
    assert.equal(compiler(blockComments, path), "import _$0 from 'real';", `${name}: block comments`);
  }
});

test('Distinguish block comments, strings and directive tokens', () => {
  for (const { name, compiler, path, directive, realSpecifier } of compilers) {
    const stringsAndTokenBoundary = `.example { content: '${directive('quoted')}'; }
.escaped { content: "prefix \\" @import 'escaped';"; }
.comment-start { content: "/*"; }
${directive(realSpecifier)}
.comment-end { content: "*/"; }
@im/* gap */port "~joined";`;
    assert.equal(
      compiler(stringsAndTokenBoundary, path),
      `import _$0 from '${realSpecifier}';`,
      `${name}: strings and token boundaries`
    );
  }
});
