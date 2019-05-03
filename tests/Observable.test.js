import Observable from '../src/Observable';

test('publish calls all subscribers', () => {
  const observable = new Observable();
  let called = 0;
  observable.subscribe(() => {
    called += 1;
  });
  observable.subscribe(() => {
    called += 1;
  });
  observable.subscribe(() => {
    called += 1;
  });

  observable.publish();
  expect(called).toBe(3);
});

test('constructor passes this to subscribe', () => {
  const thisArg = {};
  const observable = new Observable(thisArg);
  let called = false;
  observable.subscribe(function testThis() {
    expect(this).toBe(thisArg);
    called = true;
  });

  observable.publish();
  expect(called).toBeTruthy();
});

test('publish passes all arguments correctly', () => {
  const observable = new Observable();
  const testArgs = [0, true, {}, []];

  let called = null;
  observable.subscribe((...args) => {
    called = args;
  });

  observable.publish(...testArgs);
  expect(called).toEqual(testArgs);
});
