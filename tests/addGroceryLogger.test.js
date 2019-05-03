import Grocery, { addGroceryLogger } from '../src/Grocery';

const unmount = [];
afterEach(() => unmount.forEach(item => item()));

function MyLogger() {
  this.log = jest.fn();
  this.group = jest.fn();
  this.groupEnd = jest.fn();
  this.reset = () => {
    this.log.mockClear();
    this.group.mockClear();
    this.groupEnd.mockClear();
  };
}

test('addGroceryLogger adds logger as middleware and calls logger correctly', () => {
  const logger = new MyLogger();
  unmount.push(addGroceryLogger(logger));

  const grocery = new Grocery();
  grocery.addReducer((state, { type }) => {
    if (type === 'TEST') return { test: true };
    return undefined;
  });

  logger.reset();
  grocery.dispatch({ type: 'TEST_SAME' });
  expect(logger.log.mock.calls.length).toBeTruthy();
  expect(logger.group.mock.calls.length).toBeTruthy();
  expect(logger.groupEnd.mock.calls.length).toBeTruthy();

  logger.reset();
  grocery.dispatch({ type: 'TEST' });
  expect(logger.log.mock.calls.length).toBeTruthy();
  expect(logger.group.mock.calls.length).toBeTruthy();
  expect(logger.groupEnd.mock.calls.length).toBeTruthy();
});

test('addGroceryLogger returns remove call', () => {
  const logger = new MyLogger();
  const remove = addGroceryLogger(logger);

  expect(remove).toBeInstanceOf(Function);
  remove();

  const grocery = new Grocery();
  grocery.dispatch({ type: 'TEST' });

  expect(logger.log.mock.calls.length).toBe(0);
  expect(logger.group.mock.calls.length).toBe(0);
  expect(logger.groupEnd.mock.calls.length).toBe(0);
});
