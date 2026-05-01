const { findUser } = require('./index');

test('findUser returns a user', () => {
  expect(findUser(1)).toEqual({ id: 1, name: 'Ada' });
});
