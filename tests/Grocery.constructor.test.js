import React from 'react';
import Grocery from '../src/Grocery';

jest.mock('react');

const groceryWindowStorageKey = '__TEST_GROCERY__';
const createWindow = (content = {}) => {
  // noinspection JSValidateTypes
  global.window = { ...content };
};

test('constructor sets initial state as a shallow copy', () => {
  const test = { A: 1, B: 2 };
  const grocery = new Grocery({
    initState: test,
  });

  expect(grocery.getState()).not.toBe(test);
  expect(grocery.getState()).toEqual(test);
});


test('constructor sets proper Context', () => {
  React.createContext.mockClear();
  React.createContext.mockReturnValue({});

  const grocery = new Grocery();

  expect(React.createContext.mock.calls.length).toBe(1);
  expect(grocery.Context).toBeTruthy();
});

describe('constructor with provided windowProperty', () => {
  test('loads the state from window object', () => {
    const state = { test: true };
    createWindow({ [groceryWindowStorageKey]: state });

    const grocery = new Grocery({
      windowProperty: groceryWindowStorageKey,
    });

    expect(grocery.getState()).toEqual(state);
  });


  describe('hot reload', () => {
    test('saves state to the window object', () => {
      let dispose = null;

      Object.assign(global.forwardModules.grocery, {
        hot: {
          dispose: (call) => {
            dispose = call;
          },
        },
      });

      const grocery = new Grocery({
        windowProperty: groceryWindowStorageKey,
      });
      expect(typeof dispose).toBe('function');

      const state = { test: true };
      grocery.addReducer(() => state);
      grocery.dispatch({ type: 'TEST' });

      dispose();
      delete global.forwardModules.grocery.hot;

      // noinspection JSUnresolvedVariable
      expect(global.window[groceryWindowStorageKey]).toEqual(state);
    });

    test('should force to trigger firstMount', () => {
      Object.assign(global.forwardModules.grocery, {
        hot: {
          dispose: () => {},
        },
      });

      React.createContext.mockReset();
      React.useEffect.mockReset();
      React.useState.mockReset();

      React.useState.mockReturnValue([{}, () => {}]);
      React.createContext.mockReturnValue({
        Provider: {},
      });

      let firstMountCalled = false;
      const grocery = new Grocery({
        windowProperty: groceryWindowStorageKey,
        firstMount: () => {
          firstMountCalled = true;
        },
      });

      grocery.Connector({ children: [] });

      React.useEffect.mock.calls[0][0]();
      expect(firstMountCalled).toBe(true);
    });
  });
});

test('usage of grocery without connector should throw errors', () => {
  React.createContext.mockReset();
  const grocery = new Grocery();

  expect(() => React.createContext.mock.calls[0][0].publish())
    .toThrow('Component requiring a grocery was used outside of a grocery context.');
  expect(() => React.createContext.mock.calls[0][0].subscribe())
    .toThrow('Component requiring a grocery was used outside of a grocery context.');
  expect(() => React.createContext.mock.calls[0][0].dispatch())
    .toThrow('Component requiring a grocery was used outside of a grocery context.');

  expect(grocery).toBeTruthy();
});
