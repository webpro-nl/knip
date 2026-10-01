import assert from 'node:assert/strict';
import test from 'node:test';
import { compiler } from '../../src/compilers/scss.ts';

test('Compile static local SCSS URLs', () => {
  const scss = `.double { background: url("./double-quoted.jpg"); }
.single { background: url('../single-quoted.jpg'); }
.unquoted { background: url(assets/unquoted.jpg); }
.query { background: url("./query.jpg?v=1#image"); }
.external { background: url("https://cdn.example.com/external.jpg"); }
.data { background: url('data:image/svg+xml,<svg></svg>'); }
.protocol-relative { background: url(//cdn.example.com/protocol-relative.jpg); }
.root { background: url("/root.jpg"); }
.fragment { background: url("#image"); }
.empty { background: url(""); }
.variable { background: url($asset); }
.interpolated { background: url("./#{$asset}.jpg"); }
/* .comment { background: url("./commented.jpg"); } */
// .line-comment { background: url("./line-commented.jpg"); }
.string { content: 'url("./string.jpg")'; }`;

  assert.equal(
    compiler(scss, 'styles.scss'),
    `import _$0 from './double-quoted.jpg';
import _$1 from '../single-quoted.jpg';
import _$2 from './assets/unquoted.jpg';
import _$3 from './query.jpg';`
  );
});
