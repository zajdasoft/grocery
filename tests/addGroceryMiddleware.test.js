import Grocery, { addGroceryMiddleware } from '../src/Grocery';

const unmount = [];
afterEach(() => unmount.forEach(item => item()));

test('addGroceryMiddleware returns callback to remove the middleware', () => {
  const remove = addGroceryMiddleware(() => () => () => {
    throw Error('This middleware should not be executed.');
  });

  expect(remove).toBeInstanceOf(Function);
  remove();

  const grocery = new Grocery();
  grocery.dispatch({ type: 'TEST' });
});

test('addGroceryMiddleware adds middleware & dispatch runs all middlewares', () => {
  let check = 0;

  unmount.push(addGroceryMiddleware(() => next => () => {
    check += 1;
    next();
  }));

  unmount.push(addGroceryMiddleware(() => next => () => {
    check += 1;
    next();
  }));

  unmount.push(addGroceryMiddleware(() => next => () => {
    check += 1;
    next();
  }));

  const grocery = new Grocery();
  grocery.dispatch({ type: 'TEST' });

  expect(check).toBe(3);
});


test('a middleware gets all parameters as expected', () => {
  const testGrocery = new Grocery();
  testGrocery.addReducer(() => ({ test: true }));

  unmount.push(addGroceryMiddleware(grocery => next => (action) => {
    expect(grocery).toBe(testGrocery);
    expect(action).toEqual({ type: 'TEST' });
    expect(next).toBeInstanceOf(Function);
  }));

  testGrocery.dispatch({ type: 'TEST' });
});

test('successful middleware chain sets reduced state', () => {
  unmount.push(addGroceryMiddleware(() => next => action => next(action)));

  const testState = { test: true };

  const grocery = new Grocery();
  grocery.addReducer((state, { payload }) => payload);

  grocery.dispatch({ type: 'TEST', payload: testState });
  expect(grocery.getState()).toEqual(testState);
});

test('middleware passes action in the middleware chain', () => {
  const testGrocery = new Grocery();
  testGrocery.addReducer(() => ({ test: true }));

  unmount.push(addGroceryMiddleware(() => next => () => next({ type: 'TEST2' })));

  let called = '';
  unmount.push(addGroceryMiddleware(() => () => ({ type }) => {
    called = type;
  }));

  testGrocery.dispatch({ type: 'TEST' });
  expect(called).toBe('TEST2');
});


test('middleware returns news state', () => {
  const testGrocery = new Grocery();
  testGrocery.addReducer(() => ({ test: 1 }));

  unmount.push(addGroceryMiddleware(() => () => () => ({ state: 255 })));

  testGrocery.dispatch({ type: 'TEST' });
  expect(testGrocery.getState().state).toBe(255);
});
