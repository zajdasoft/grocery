import Grocery, { addGroceryMiddleware } from '../src/Grocery';

const unmount = [];
afterEach(() => unmount.forEach(item => item()));

test('addGroceryMiddleware returns callback to remove the middleware', () => {
  const remove = addGroceryMiddleware(() => {
    throw Error('This middleware should not be executed.');
  });

  expect(remove).toBeInstanceOf(Function);
  remove();

  const grocery = new Grocery();
  grocery.dispatch({ type: 'TEST' });
});

test('addGroceryMiddleware adds middleware & dispatch runs all middlewares', () => {
  let check = 0;

  unmount.push(addGroceryMiddleware((grocery, newState, action, next) => {
    check += 1;
    next();
  }));

  unmount.push(addGroceryMiddleware((grocery, newState, action, next) => {
    check += 1;
    next();
  }));

  unmount.push(addGroceryMiddleware((grocery, newState, action, next) => {
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

  unmount.push(addGroceryMiddleware((grocery, newState, action, next) => {
    expect(grocery).toBe(testGrocery);
    expect(newState).toEqual({ test: true });
    expect(action).toEqual({ type: 'TEST' });
    expect(next).toBeInstanceOf(Function);
  }));

  testGrocery.dispatch({ type: 'TEST' });
});

test('successful middleware chain sets new state', () => {
  unmount.push(addGroceryMiddleware((grocery, newState, action, next) => next()));

  const testState = { test: true };

  const grocery = new Grocery();
  grocery.addReducer((state, { payload }) => payload);

  grocery.dispatch({ type: 'TEST', payload: testState });
  expect(grocery.getState()).toEqual(testState);
});

test('middleware can change action for the middleware chain', () => {
  const testGrocery = new Grocery();
  testGrocery.addReducer(() => ({ test: true }));

  unmount.push(addGroceryMiddleware((grocery, newState, action, next) => next({ type: 'TEST2' })));

  let called = '';
  unmount.push(addGroceryMiddleware((grocery, newState, { type }) => {
    called = type;
  }));

  testGrocery.dispatch({ type: 'TEST' });
  expect(called).toBe('TEST2');
});


test('middleware can change newState for the middleware chain, this not affect result of reducer when the last middleware returns result of next()', () => {
  const testGrocery = new Grocery();
  testGrocery.addReducer(() => ({ test: 1 }));

  unmount.push(addGroceryMiddleware((grocery, newState, action, next) => next(action, { test: 2 })));

  let called = 0;
  unmount.push(addGroceryMiddleware((grocery, newState, action, next) => {
    called = newState.test;
    return next();
  }));

  testGrocery.dispatch({ type: 'TEST' });
  expect(called).toBe(2);
  expect(testGrocery.getState().test).toBe(1);
});
