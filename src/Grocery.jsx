import React, { useState, useEffect, useContext } from 'react';
import { arrayOf, node, oneOfType } from 'prop-types';
import Observable from './Observable';
import Collection from './Collection';

/**
 * @typedef Action
 * @property {string} type Action type.
 * @property {*} [payload] Action payload.
 */
/**
 * @typedef Message
 * @property {string} type Message type.
 * @property {*} [payload] Message payload.
 */
/**
 * @callback middleware
 * @param {Grocery} grocery Caller Grocery.
 * @param {*} newState New state to be added.
 * @param {Action} action Launching action.
 * @param {Function} next Next middleware in the chain call.
 */
/**
 * @callback messageCallback
 * @param {Message} message Received message.
 */

const middlewares = [];

/**
 * Add a middleware.
 * @param {middleware} middleware
 * @returns {Function} Remove middleware call.
 */
export const addGroceryMiddleware = (middleware) => {
  if (middlewares.indexOf(middleware) >= 0) throw Error('Middleware is already in the middleware chain.');
  middlewares.push(middleware);
  return () => {
    middlewares.splice(middlewares.indexOf(middleware), 1);
  };
};

/**
 * Grocery logger.
 * @param logger Logging object.
 * @returns {Function}
 */
const groceryDefaultLogger = logger => grocery => next => (action) => {
  const state = grocery.getState();
  const newState = next(action);

  logger.group('%c action', 'color: #cccccc', `${(action && action.type) || action}`);
  logger.log('%caction', 'color: #cccccc', action);

  if (newState === state) {
    logger.log('%cunchangedState', 'color: #cccccc', state);
  } else {
    logger.log('%cprevState', 'color: #cc0000', state);
    logger.log('%cnextState', 'color: #0000cc', newState);
  }

  logger.groupEnd();
  return newState;
};

/**
 * Add logger for grocery.
 * @param logger Logger object. Default is console.
 * @returns {Function} Remove logger call.
 */
export const addGroceryLogger = (logger = console) => (
  addGroceryMiddleware(groceryDefaultLogger(logger))
);

/**
 * Make a function from array of functions.
 * @param {Function[]} array
 * @return {Function}
 */
const makeCallableArray = array => (...args) => {
  array.forEach(x => x(...args));
};

/**
 * Map array items or single object as an array.
 * @param {[]|*} array Array to call on. When the
 * @param {function(*, number):*} map Mapping function.
 * @return {*[]} Mapped array.
 */
const mapArrayOrSingle = (array, map) => (Array.isArray(array)
  ? array.map(map)
  : [map(array, 0)]);

/**
 * {@link GroceryCore} provides instance of {@link Grocery}.
 * @param {*} initState Initial state.
 * @param {Grocery} grocery Parent grocery.
 * @constructor
 */
class GroceryCore {
  constructor(initState, grocery) {
    this.state = initState;
    this.observer = new Observable(grocery);
  }

  /**
   * Set new state.
   * @param {*} newState
   */
  setState(newState) {
    this.state = newState;
    this.observer.publish(newState);
  }
}

/**
 * {@link Grocery} constructs a general store and connecting components for it.
 * @param {*} [initState] Initial state.
 * @param {Function} [firstMount] Call when the first component is firstly mounted.
 * @param {string} [windowProperty]
 *  Window property specifies property of the {@link window} object which is used to load
 *  initial state from when the page is loaded after server-side render.
 *  Setting this option will also save the state when HMR occurs.
 * @constructor
 */
export default function Grocery({
  initState = null,
  firstMount = null,
  windowProperty = '',
} = {}) {
  const initStateCopy = initState ? { ...initState } : initState;

  const reducers = new Collection();
  const namedReducers = {};

  /**
   * Call a reducer.
   * @param {Function|Object} wrapReducer Reducer or wrapped reducer with enhancements.
   * @param {*} state Current state.
   * @param {Action} action Action.
   * @param {Function} next Next enhancement call.
   * @return {*} New state.
   */
  const callReducer = (wrapReducer, state, action, next = undefined) => {
    if (typeof wrapReducer === 'function') return wrapReducer(state, action, next);

    const { reducer, enhancers } = wrapReducer;
    if (enhancers.length() === 0) return reducer(state, action, next);

    let index = -1;

    const callNext = (newState = state, newAction = action) => {
      index += 1;
      return index >= enhancers.length()
        ? reducer(newState, newAction, next)
        : callReducer(enhancers.get(index), newState, newAction, callNext);
    };

    return callNext();
  };

  /**
   * Reduce the state.
   * @param {*} state Current state.
   * @param {Action} action
   * @return {*} New state.
   */
  const reduce = (state, action) => {
    for (let i = 0; i < reducers.length(); i += 1) {
      const ret = callReducer(reducers.get(i), state, action);
      if (typeof ret !== 'undefined' && ret !== state) return ret;
    }
    return state;
  };

  /**
   * Add named reducer to the named collection.
   * @param {string} name Reducer name.
   * @param {Function} reducer Reducer implementation.
   * @param {string} prefix Error message prefix.
   * @return {Function|Object} Reducer or its wrapper.
   */
  const addNamedReducer = (name, reducer, prefix = 'Reducer') => {
    if (typeof reducer !== 'function') throw Error(`${prefix} must be a function.`);
    if (!name) return reducer;
    if (name && typeof name !== 'string') throw Error(`${prefix} name must be a string.`);
    if (namedReducers[name]) throw Error(`A reducer with name ${name} is already added.`);

    const wrapper = {
      reducer,
      enhancers: new Collection(),
    };

    namedReducers[name] = wrapper;
    return wrapper;
  };

  /**
   * Add a reducer.
   * @param {Function} reducer Reducer implementation.
   * @param {string} [name] Reducer name allows the reducer to be enhanced.
   * @returns {Function} Call to remove the reducer.
   */
  this.addReducer = (reducer, name = '') => {
    const wrapReducer = addNamedReducer(name, reducer);
    const remove = reducers.add(wrapReducer);
    return () => {
      remove();
      if (name) delete namedReducers[name];
    };
  };

  /**
   * Enhance a reducer.
   * @param {string} name Name of a reducer which should be enhanced.
   * @param {Function} enhancementReducer Enhancement reducer implementation.
   * @param {string} enhancementReducerName Enhancement reducer name.
   * @return {Function} Call to remove the enhancement reducer.
   */
  this.enhanceReducer = (name, enhancementReducer, enhancementReducerName = '') => {
    if (typeof name !== 'string') throw Error('Enhanced reducer name must be a string.');
    if (typeof namedReducers[name] === 'undefined') throw Error(`There is no reducer with name ${name} in this grocery.`);
    const wrapReducer = addNamedReducer(enhancementReducerName, enhancementReducer, 'Enhancement reducer');
    const remove = namedReducers[name].enhancers.add(wrapReducer);
    return () => {
      remove();
      if (enhancementReducerName) delete namedReducers[enhancementReducerName];
    };
  };

  const core = new GroceryCore(initStateCopy, this);

  let hotDispose = null;
  if (typeof window !== 'undefined' && windowProperty) {
    /* eslint-disable no-undef */
    const storePreloadValue = window[windowProperty] || initStateCopy;
    core.state = storePreloadValue ? { ...storePreloadValue } : storePreloadValue;
    hotDispose = () => { window[windowProperty] = core.state; };
  }

  /**
   * React context for the grocery.
   */
  this.Context = React.createContext({
    state: undefined,
    publish: () => throw Error('Component requiring a grocery was used outside of a grocery context.'),
    subscribe: () => throw Error('Component requiring a grocery was used outside of a grocery context.'),
    dispatch: () => throw Error('Component requiring a grocery was used outside of a grocery context.'),
  });

  /**
   * Dispatch an action.
   * @param {Action} action Action to dispatch.
   * @param {string} action.type Action type.
   * @param {*} action.payload Action payload.
   */
  this.dispatch = (action) => {
    if (!action) throw Error('Action can\'t be empty.');
    if (typeof action !== 'object') throw Error('Action must be an object.');
    if (Array.isArray(action)) throw Error('Action must be an object.');
    if (typeof action.type !== 'string') throw Error('Action must contain type field.');

    let index = -1;

    const next = (newAction) => {
      index += 1;
      return index >= middlewares.length
        ? reduce(core.state, newAction)
        : middlewares[index](this)(next)(newAction);
    };

    const newState = next(action);
    core.setState(newState);
  };

  const messaging = {};

  /**
   * Publish a message.
   * @param {Message} message Message to publish.
   * @param {string} message.type Message type.
   * @param {*} [message.payload] Message data.
   */
  this.publish = (message) => {
    if (!message) throw Error('Message can\'t be empty.');
    if (typeof message !== 'object') throw Error('Message must be an object.');
    if (Array.isArray(message)) throw Error('Message must be an object.');
    if (typeof message.type !== 'string') throw Error('Message must contain type field.');

    if (!messaging[message.type]) return;
    messaging[message.type].publish(message);
  };

  /**
   * Subscribe for a message of a type.
   * @param {string|string[]} type Message type.
   * @param {messageCallback} callback Message receiver.
   * @returns {Function} Unsubscribe call.
   */
  this.subscribe = (type, callback) => {
    const subscribe = (onlyType) => {
      if (!messaging[onlyType]) messaging[onlyType] = new Observable(this);
      return messaging[onlyType].subscribe(callback);
    };

    return makeCallableArray(mapArrayOrSingle(type, item => subscribe(item)));
  };

  let checkFirstMounted = false;
  hotDispose = () => {
    checkFirstMounted = false;
  };

  // noinspection JSUnresolvedVariable
  if (module.hot) { // noinspection JSUnresolvedVariable
    module.hot.dispose(() => hotDispose());
  }

  /**
   * Grocery connector component.
   * @param children Component children.
   * @returns {*}
   * @constructor
   */
  const Connector = ({ children }) => {
    const [state, setState] = useState(core.state);

    useEffect(() => {
      core.observer.subscribe(newState => setState(newState));
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

  Connector.propTypes = {
    children: oneOfType([node, arrayOf(node)]).isRequired,
  };

  this.Connector = Connector;

  /**
   * Use the grocery.
   * @returns {*}
   */
  this.useGrocery = () => useContext(this.Context);

  /**
   * Use the grocery's state.
   * @return {*}
   */
  this.useGroceryState = () => this.useGrocery().state;

  /**
   * Get current state.
   * @returns {*}
   */
  this.getState = () => core.state;
}

/* --- Jest temporary hackity-hack --- */
/* eslint-disable */
if (typeof global !== 'undefined') {
  // noinspection JSUnresolvedVariable
  global.forwardModules = Object.assign({}, global.forwardModuleFunctions, {
    grocery: module,
  });
}
