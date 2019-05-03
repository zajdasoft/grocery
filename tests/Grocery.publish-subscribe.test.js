import Grocery from '../src/Grocery';


test('subscribe adds a listener and publish notifies', () => {
  const grocery = new Grocery();
  let check = false;

  grocery.subscribe('ACTION', () => {
    check = true;
  });

  grocery.publish({ type: 'ACTION' });
  expect(check).toBe(true);
});

test('subscribe allows to use type as array, the same subscriber is used for all the types', () => {
  const grocery = new Grocery();
  let check = 0;

  grocery.subscribe(['ACTION1', 'ACTION2'], () => {
    check += 1;
  });

  grocery.publish({ type: 'ACTION1' });
  grocery.publish({ type: 'ACTION2' });

  expect(check).toBe(2);
});

test('publish triggers all subscribers', () => {
  const grocery = new Grocery();
  let check = 0;

  grocery.subscribe('ACTION', () => {
    check += 1;
  });
  grocery.subscribe('ACTION', () => {
    check += 1;
  });
  grocery.subscribe('ACTION', () => {
    check += 1;
  });

  grocery.publish({ type: 'ACTION' });
  expect(check).toBe(3);
});

test('publish triggers only subscribers of given type', () => {
  const grocery = new Grocery();
  grocery.subscribe('ACTION1', () => {
    throw Error('This subscriber should not be triggered.');
  });
  grocery.subscribe('ACTION2', () => {
    throw Error('This subscriber should not be triggered.');
  });
  grocery.subscribe('ACTION3', () => {
    throw Error('This subscriber should not be triggered.');
  });

  grocery.publish({ type: 'ACTION' });
});


test('subscribe returns unsubscribe call', () => {
  const grocery = new Grocery();
  const unsubscribe = grocery.subscribe('ACTION', () => {
    throw Error('This subscriber should not be triggered.');
  });

  expect(unsubscribe).toBeInstanceOf(Function);
  unsubscribe();

  grocery.publish({ type: 'ACTION' });
});

test('subscribe with multiple types returns single unsubscribe call to unsubscribe all', () => {
  const grocery = new Grocery();
  const unsubscribe = grocery.subscribe(['ACTION1', 'ACTION2'], () => {
    throw Error('This subscriber should not be triggered.');
  });

  expect(unsubscribe).toBeInstanceOf(Function);
  unsubscribe();

  grocery.publish({ type: 'ACTION1' });
  grocery.publish({ type: 'ACTION2' });
});
