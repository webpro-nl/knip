import assert from 'node:assert/strict';
import test from 'node:test';
import { compiler } from '../../src/compilers/scss.ts';

test('Compile static SCSS meta.load-css URLs', () => {
  const scss = `@use 'sass:meta';

@layer base {
  @include meta.load-css('layered');
}
@include sass-meta.load-css("pkg:bulma/sass/utilities");
@include load-css('pkg:@fontsource/lato/scss/mixins');
@include meta.load-css(
  'pkg:bootstrap/scss/reboot',
  $with: ('enable-shadows': true)
);
@include meta.load-css($theme-path);
@include meta.load-css('themes/#{$theme}');
@include meta.load-css('themes/' + $theme);
@include not-load-css('lookalike');
// @include meta.load-css('line-commented');
/* @include meta.load-css('block-commented'); */
.double { content: "@include meta.load-css('double-quoted')"; }
.single { content: '@include meta.load-css("single-quoted")'; }`;

  assert.equal(
    compiler(scss, 'styles.scss'),
    `import _$0 from './layered.scss';
import _$1 from './_layered.scss';
import _$2 from './layered.sass';
import _$3 from './_layered.sass';
import _$4 from 'bulma/sass/utilities';
import _$5 from '@fontsource/lato/scss/mixins';
import _$6 from 'bootstrap/scss/reboot';`
  );
});
