import Grocery from '../src/Grocery';

test('addReducer adds a reducer', () => {
  const grocery = new Grocery();
  let check = false;

  grocery.addReducer(() => {
    check = true;
  });

  grocery.dispatch({ type: 'TEST' });
  expect(check).toBe(true);
});

test('addReducer returns remove callback, which removes the reducer', () => {
  const grocery = new Grocery({ initState: {} });
  const remove = grocery.addReducer(() => {
    throw Error('This reducer should not be used.');
  });

  expect(remove).toBeInstanceOf(Function);

  remove();
  grocery.dispatch({ type: 'TEST' });
});
