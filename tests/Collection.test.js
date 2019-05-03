import Collection from '../src/Collection';

test('add adds an item', () => {
  const collection = new Collection();
  expect(collection.length()).toBe(0);
  collection.add('item');
  expect(collection.length()).toBe(1);
});

test('add returns remove function', () => {
  const collection = new Collection();
  const remove = collection.add('item');
  expect(remove).toBeInstanceOf(Function);
  remove();
  expect(collection.get(0)).toBeUndefined();
});

test('remove function removes only added item', () => {
  const collection = new Collection();
  const remove = collection.add('item');
  collection.add('item1');
  collection.add('item');

  expect(remove).toBeInstanceOf(Function);
  remove();
  remove();

  expect(collection.get(0)).toBe('item1');
  expect(collection.get(1)).toBe('item');
});

test('length returns correct length', () => {
  const collection = new Collection();
  expect(collection.length()).toBe(0);
  collection.add('item');
  collection.add('item');
  collection.add('item');
  expect(collection.length()).toBe(3);
});

test('get returns correct item', () => {
  const collection = new Collection();
  collection.add('item1');
  collection.add('item2');
  collection.add('item3');
  expect(collection.get(0)).toBe('item1');
  expect(collection.get(1)).toBe('item2');
  expect(collection.get(2)).toBe('item3');
  expect(collection.get(3)).toBeUndefined();
  expect(collection.get(-1)).toBeUndefined();
});
