import React from 'react';
import Grocery from '../src/Grocery';

jest.mock('react');

test('useGroceryState returns proper state', () => {
  const state = { test: true };
  const ctxValue = { state, dispatch: () => {} };

  React.createContext.mockReset();
  React.createContext.mockReturnValue({});
  React.useContext.mockReset();
  React.useContext.mockReturnValue(ctxValue);

  const grocery = new Grocery();
  expect(grocery.useGroceryState()).toEqual(state);
});
