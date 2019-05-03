import React from 'react';
import Grocery from '../src/Grocery';

jest.mock('react');

describe('useGrocery', () => {
  test('returns proper context value', () => {
    const ctxValue = { state: true, dispatch: () => {} };

    React.createContext.mockReset();
    React.createContext.mockReturnValue({});
    React.useContext.mockReset();
    React.useContext.mockReturnValue(ctxValue);

    const grocery = new Grocery();
    expect(grocery.useGrocery()).toBe(ctxValue);
  });

  test('uses proper context', () => {
    const context = { Provider: {}, Consumer: {} };

    React.createContext.mockReset();
    React.createContext.mockReturnValue(context);
    React.useContext.mockReset();

    const grocery = new Grocery();
    grocery.useGrocery();

    expect(React.useContext.mock.calls[0][0]).toBe(context);
  });
});
