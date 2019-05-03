import Grocery from '../src/Grocery';

test('enhanceReducer enhances a reducer', () => {
  const grocery = new Grocery();
  grocery.addReducer(() => {}, 'test-reducer');

  let called = false;
  grocery.enhanceReducer('test-reducer', () => {
    called = true;
  });

  grocery.dispatch({ type: 'TEST' });
  expect(called).toBeTruthy();
});

test('not enhanced reducers will not get parameter `next`', () => {
  const grocery = new Grocery();
  let called = false;
  grocery.addReducer((state, action, next) => {
    expect(next).toBeUndefined();
    called = true;
  }, 'test-reducer');

  grocery.enhanceReducer('test-reducer', (state, action, next) => next());
  grocery.dispatch({ type: 'TEST' });

  expect(called).toBeTruthy();
});

test('enhanced reducers chain is called properly', () => {
  const grocery = new Grocery();

  let reducerCalled = false;
  let e1Called = false;
  let e2Called = false;
  let e3Called = false;
  let e4Called = false;

  grocery.addReducer(() => {
    reducerCalled = true;
  }, 'test-reducer');

  grocery.enhanceReducer('test-reducer', (state, action, next) => {
    e1Called = true;
    next();
  }, 'e1');

  grocery.enhanceReducer('e1', (state, action, next) => {
    e2Called = true;
    next();
  }, 'e2');

  grocery.enhanceReducer('test-reducer', (state, action, next) => {
    e3Called = true;
    next();
  }, 'e3');

  grocery.enhanceReducer('e2', (state, action, next) => {
    e4Called = true;
    next();
  }, 'e4');

  grocery.dispatch({ type: 'TEST' });

  expect(reducerCalled).toBeTruthy();
  expect(e1Called).toBeTruthy();
  expect(e2Called).toBeTruthy();
  expect(e3Called).toBeTruthy();
  expect(e4Called).toBeTruthy();
});

test('enhanced reducer next() calls next enhancer or reducer according to the chain', () => {
  const grocery = new Grocery();
  let callStack = 0;
  grocery.addReducer(() => {
    // called after 'b'
    expect(callStack).toBe(3);
  }, 'test-reducer');

  grocery.enhanceReducer('test-reducer', (state, action, next) => {
    // enhanced by 'c'
    expect(callStack).toBe(1);
    callStack += 1;
    next();
    // returns from 'b'
    expect(callStack).toBe(4);
  }, 'a');

  grocery.enhanceReducer('test-reducer', (state, action, next) => {
    // called after 'a'
    expect(callStack).toBe(2);
    callStack += 1;
    next();
    // reducer returns
    expect(callStack).toBe(3);
    callStack += 1;
  }, 'b');

  grocery.enhanceReducer('a', (state, action, next) => {
    // must be called first
    expect(callStack).toBe(0);
    callStack += 1;
    next();
    // must return from 'a'
    expect(callStack).toBe(4);
  }, 'c');

  grocery.dispatch({ type: 'TEST' });
  expect(callStack).toBe(4);
});

test('reducer after enhancement gets state from enhancer', () => {
  const newState = { test: true };

  const grocery = new Grocery();
  let called = false;
  grocery.addReducer((state) => {
    expect(state).toBe(newState);
    called = true;
  }, 'test-reducer');

  grocery.enhanceReducer('test-reducer', (state, action, next) => {
    next(newState);
  }, 'a');

  grocery.dispatch({ type: 'TEST' });
  expect(called).toBeTruthy();
});

test('enhancement after enhancement gets state from enhancer', () => {
  const newState = { test: true };

  const grocery = new Grocery();
  let called = false;
  grocery.addReducer(() => {}, 'test-reducer');

  grocery.enhanceReducer('test-reducer', (state) => {
    expect(state).toBe(newState);
    called = true;
  }, 'a');

  grocery.enhanceReducer('a', (state, action, next) => {
    next(newState);
  }, 'b');

  grocery.dispatch({ type: 'TEST' });
  expect(called).toBeTruthy();
});

test('dispatch sets state according to enhancer reducer', () => {
  const newState = { test: true };

  const grocery = new Grocery();
  grocery.addReducer(() => {}, 'test-reducer');

  grocery.enhanceReducer('test-reducer', () => newState, 'a');

  grocery.dispatch({ type: 'TEST' });
  expect(grocery.getState()).toBe(newState);
});

test('when enhancer calls next() without newState parameter, current state is used instead', () => {
  const newState = { test: true };

  const grocery = new Grocery({ initState: newState });
  let called = false;
  grocery.addReducer((state) => {
    expect(state).toEqual(newState);
    called = true;
  }, 'test-reducer');

  grocery.enhanceReducer('test-reducer', (state, action, next) => {
    next();
  });

  grocery.dispatch({ type: 'TEST' });
  expect(called).toBeTruthy();
});

test('enhanceReducer returns remove callback, which removes the enhancement', () => {
  const grocery = new Grocery();
  grocery.addReducer(() => {}, 'test-reducer');
  const remove = grocery.enhanceReducer('test-reducer', () => {
    throw Error('This reducer should not be used.');
  });

  expect(remove).toBeInstanceOf(Function);

  remove();
  grocery.dispatch({ type: 'TEST' });
});
