import { assert } from '@esm-bundle/chai';

it('joins strings', () => {
  assert.equal(['a', 'b'].join(''), 'ab');
});
