import React, { useState, useEffect, useContext } from 'react';
import { arrayOf, node, oneOfType } from 'prop-types';
import Observable from './Observable';

/**
 * Grocery constructs a general store and connecting components for it.
 * @param {*} initState Initial state.
 * @param {Function} firstMount Call when the first component is firstly mounted.
 * @constructor
 */
export default function Grocery(initState, firstMount = null) {
  const reducers = [];
  const reduce = (state, action) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const reducer of reducers) {
      const ret = reducer(state, action);
      if (typeof ret !== 'undefined') return ret;
    }
    return state;
  };

  /**
   * Add a reducer.
   * @param {Function} reducer
   * @returns {Function} Call to remove the reducer.
   */
  this.addReducer = (reducer) => {
    if (typeof reducer !== 'function') throw Error('Reducer must be a function.');
    reducers.push(reducer);

    let protect = false;
    return () => {
      if (protect) return;
      protect = true;
      reducers.splice(reducers.indexOf(reducer), 1);
    };
  };

  let store = initState;
  const oStore = new Observable(this);

  /**
   * React context for the grocery.
   */
  this.Context = React.createContext({
    state: undefined,
    publish: () => throw Error('Component requiring a grocery was used outside of a grocery context.'),
    dispatch: () => throw Error('Component requiring a grocery was used outside of a grocery context.'),
  });

  /**
   * Dispatch an action.
   * @param {*} action Action to dispatch.
   */
  this.dispatch = (action) => {
    const newState = reduce(store, action);
    if (newState === store) return;
    store = newState;
    oStore.publish(newState);
  };

  const messaging = {};

  /**
   * Publish a message.
   * @param {string} type Message type.
   * @param {*} data Message data.
   */
  this.publish = (type, data) => {
    if (!messaging[type]) return;
    messaging[type].publish(data, type);
  };

  /**
   * Subscribe for a message.
   * @param {string} type Message type.
   * @param {Function} callback Message receiver.
   * @returns {Function} Unsubscribe call.
   */
  this.subscribe = (type, callback) => {
    if (!messaging[type]) messaging[type] = new Observable(this);
    return messaging[type].subscribe(callback);
  };

  let checkFirstMounted = false;
  let ignoreHotReloadMounted = false;
  if (module.hot) {
    module.hot.dispose(() => {
      if (!ignoreHotReloadMounted) checkFirstMounted = false;
    });
  }

  /**
   * Grocery connector component.
   * @param children Component children.
   * @returns {*}
   * @constructor
   */
  this.Connector = ({ children }) => {
    const [state, setState] = useState(initState);

    useEffect(() => {
      oStore.subscribe(newState => setState(newState));
      // First mount is useful to detect that the Grocery is really used.
      if (!firstMount || checkFirstMounted) return;
      checkFirstMounted = true;
      firstMount.call(this);
    }, []);

    const { Context, dispatch, publish } = this;
    return (
      <Context.Provider
        value={{
          state,
          dispatch,
          publish,
        }}
      >
        {children}
      </Context.Provider>
    );
  };

  this.Connector.propTypes = {
    children: oneOfType([node, arrayOf(node)]).isRequired,
  };

  /**
   * Use the grocery.
   * @returns {*}
   */
  this.useGrocery = () => useContext(this.Context);

  /**
   * Get current state.
   * @returns {*}
   */
  this.getState = () => store;

  /**
   * Preload the store from window object. Useful for SSR.
   * When hot-reloaded keeps the data in window so the store doesn't need to be loaded again.
   * @param {string} name Window Grocery name.
   * @returns {Grocery}
   */
  this.preload = (name) => {
    store = window[name] || initState;
    if (module.hot) module.hot.dispose(() => window[name] = store);
    ignoreHotReloadMounted = true;
    return this;
  };
}
