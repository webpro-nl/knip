const { placeOrder } = require('./index');

test('placeOrder returns a placed order', () => {
  expect(placeOrder('book')).toEqual({ item: 'book', status: 'placed' });
});
