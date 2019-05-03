import Grocery from '../src/Grocery';

test('dispatch calls all reducers correctly', () => {
  const grocery = new Grocery({ initState: {} });

  grocery.addReducer((state, action) => (action.type === 'TEST1'
    ? { ...state, test1: true }
    : state));

  grocery.addReducer((state, action) => (action.type === 'TEST2'
    ? { ...state, test2: true }
    : state));

  grocery.addReducer((state, action) => (action.type === 'TEST3'
    ? { ...state, test3: true }
    : undefined));

  grocery.addReducer((state, action) => (action.type === 'TEST4'
    ? { ...state, test4: true }
    : undefined));

  grocery.dispatch({ type: 'TEST1' });
  grocery.dispatch({ type: 'TEST2' });
  grocery.dispatch({ type: 'TEST3' });
  grocery.dispatch({ type: 'TEST4' });

  expect(grocery.getState()).toEqual({
    test1: true,
    test2: true,
    test3: true,
    test4: true,
  });
});

test('dispatch will stop executing reducer chain when a reducer returns new state', () => {
  const grocery = new Grocery({ initState: {} });

  grocery.addReducer((state, action) => (action.type === 'TEST1'
    ? { ...state, test1: true }
    : state));

  grocery.addReducer((state, action) => (action.type === 'TEST2'
    ? { ...state, test2: true }
    : state));

  grocery.addReducer((state, action) => (action.type === 'TEST2'
    ? { ...state, test3: true }
    : undefined));

  grocery.addReducer((state, action) => (action.type === 'TEST2'
    ? { ...state, test4: true }
    : undefined));

  grocery.dispatch({ type: 'TEST2' });

  expect(grocery.getState()).toEqual({
    test2: true,
  });
});


test('dispatch sets proper parameters for reducers', () => {
  const testState = { status: 'test' };
  const testAction = { type: 'TEST', payload: 'content' };

  const grocery = new Grocery({ initState: testState });
  grocery.addReducer((state, action) => {
    expect(state).toEqual(testState);
    expect(action).toBe(testAction);
  });

  grocery.dispatch(testAction);
});


test('dispatch won\'t change the state when no reducer is available', () => {
  const grocery = new Grocery({ initState: { test: true } });

  const oldSate = grocery.getState();
  grocery.dispatch({ type: 'TEST' });

  expect(grocery.getState()).toBe(oldSate);
});

test('dispatch won\'t allow to pass invalid data as an action', () => {
  const grocery = new Grocery();

  // noinspection JSCheckFunctionSignatures
  expect(() => grocery.dispatch(null)).toThrow('Action can\'t be empty.');
  // noinspection JSCheckFunctionSignatures
  expect(() => grocery.dispatch(0)).toThrow('Action can\'t be empty.');
  // noinspection JSCheckFunctionSignatures
  expect(() => grocery.dispatch(false)).toThrow('Action can\'t be empty.');
  expect(() => grocery.dispatch(undefined)).toThrow('Action can\'t be empty.');

  // noinspection JSCheckFunctionSignatures
  expect(() => grocery.dispatch(1)).toThrow('Action must be an object.');
  // noinspection JSCheckFunctionSignatures
  expect(() => grocery.dispatch('test')).toThrow('Action must be an object.');
  // noinspection JSCheckFunctionSignatures
  expect(() => grocery.dispatch(true)).toThrow('Action must be an object.');
  // noinspection JSCheckFunctionSignatures
  expect(() => grocery.dispatch([])).toThrow('Action must be an object.');

  // noinspection JSCheckFunctionSignatures
  expect(() => grocery.dispatch({ some: 'data' })).toThrow('Action must contain type field.');
});
