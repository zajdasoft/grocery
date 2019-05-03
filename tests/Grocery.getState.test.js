import Grocery from '../src/Grocery';

test('getState returns current state every time', () => {
  const grocery = new Grocery();
  grocery.addReducer((state, { type, payload }) => {
    switch (type) {
      case 'INIT':
        return { value: 0 };
      case 'ADD':
        return { value: state.value + payload };
      case 'NOTE':
        return { ...state, note: payload };
      default:
        return state;
    }
  });


  expect(grocery.getState()).toBeNull();

  grocery.dispatch({ type: 'INIT' });
  expect(grocery.getState()).toEqual({ value: 0 });

  grocery.dispatch({ type: 'ADD', payload: 5 });
  expect(grocery.getState()).toEqual({ value: 5 });

  grocery.dispatch({ type: 'ADD', payload: 5 });
  expect(grocery.getState()).toEqual({ value: 10 });

  grocery.dispatch({ type: 'NOTE', payload: 'test' });
  expect(grocery.getState()).toEqual({ value: 10, note: 'test' });

  grocery.dispatch({ type: 'ADD', payload: 5 });
  expect(grocery.getState()).toEqual({ value: 15 });

  grocery.dispatch({ type: 'INIT' });
  expect(grocery.getState()).toEqual({ value: 0 });
});
