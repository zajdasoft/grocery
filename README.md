# grocery
Grocery JS / container for managing application state, designed to be used in modular applications. 
Combining power of redux-like store and messaging system.

## About

Grocery is designed for typical portal web application. Modules can be loaded during application lifetime, providing many
useful widgets for your dashboard, website builder, etc. In such scenario single store powering whole system gets 
complicated and low performant. This brings the idea to split the single store to multiple groceries.

Breaking a store to smaller entities might bring a need to communicate changes between groceries. Because of that Grocery
comes with messaging system (publisher-subscriber pattern).

## Installation

```$ npm install @zajdasoft/grocery```

or:

```$ yarn add @zajdasoft/grocery```

## Usage

### Basic usage

In your ``src`` directory create new directory ``groceries``. In this directory create new file ``MyGrocery.js``
like this:

```javascript
import Grocery from '@zajdasoft/grocery';

export const ADD_TODO = 'ADD_TODO';

const MyGrocery = new Grocery({
  initState: {
    toDos: [],
  },
});

MyGrocery.addReducer((state, { type, payload }) => {
  switch (type) {
    case ADD_TODO:
      return {
        ...state,
        toDos: [
          ...state.toDos,
          payload
        ]
      };
  }
});

export default MyGrocery;
```

In your ```Application``` component you need to bind the grocery to react:

```jsx
import React from 'react';
import MyGrocery from './groceries/MyGrocery';
import MyComponent from './MyComponent';

const Application = () => (
  <MyGrocery.Connector>
    <MyComponent />
  </MyGrocery.Connector>
)

export default Application;
``` 

In your component ```src/MyComponent.jsx``` then:

```jsx
import React from 'react';
import MyGrocery, { ADD_TODO } from './groceries/MyGrocery';

const MyComponent = () => {
  const { toDos } = MyGrocery.useGroceryState();
  const { dispatch } = MyGrocery.useGrocery();
  const addTodo = () => {
    const todo = confirm('Add a to-do.');
    if (!todo) return;
    dispatch({ type: ADD_TODO, payload: todo });
  }
  
  return (
    <>
      <ul>
        {toDos.map(item => <li>{item}</li>)}
      </ul>
      <button type="button" onClick={addTodo}>Add Todo</button>
    </>
  );
}

```

### Messaging system

Let's say that there is a module which is going to alert count of stored to-dos when a todo is added. Let it be in
``src/CountModule.js``:

```javascript

import MyGrocery, { ADD_TODO } from './groceries/MyGrocery';

MyGrocery.subscribe(ADD_TODO, ({ payload }) => {
  alert(`There are ${payload} to-do(s).`);
});

```

Now, because reducers should not have any side-effects, we need to publish the message in our ``MyComponent``:

```jsx
import React from 'react';
import MyGrocery, { ADD_TODO } from './groceries/MyGrocery';

const MyComponent = () => {
  const { toDos } = MyGrocery.useGroceryState();
  const { dispatch, publish } = MyGrocery.useGrocery();
  const addTodo = () => {
    const todo = confirm('Add a to-do.');
    if (!todo) return;
    dispatch({ type: ADD_TODO, payload: todo });
    publish({ type: ADD_TODO, payload: toDos.length + 1 });
  }
  
  return (
    <>
      <ul>
        {toDos.map(item => <li>{item}</li>)}
      </ul>
      <button type="button" onClick={addTodo}>Add Todo</button>
    </>
  );
}

```

### Enhancing reducers

In some particular cases we might want to enhance a reducer from another module. To achieve that we need to name
the reducer which should be enhanced. This can be done by adding name to ``addReducer`` call. Note that reducers
without a name can't be enhanced. Naming a reducer should make the reducer aware that it might be enhanced.

In ``src/MyGrocery.js``:

```javascript
import Grocery from '@zajdasoft/grocery';

export const ADD_TODO = 'ADD_TODO';
export const REDUCER_BASE_TODO = 'REDUCER_BASE_TODO';

const MyGrocery = new Grocery({
  initState: {
    toDos: [],
  },
});

MyGrocery.addReducer((state, { type, payload }) => {
  switch (type) {
    case ADD_TODO:
      return {
        ...state,
        toDos: [
          ...state.toDos,
          payload
        ]
      };
  }
}, REDUCER_BASE_TODO);

export default MyGrocery;
```

Now we can enhance our reducer from ```src/AnotherModule.js```:

```javascript

import MyGrocery, { ADD_TODO, REDUCER_BASE_TODO } from './groceries/MyGrocery';

MyGrocery.enhanceReducer(REDUCER_BASE_TODO, (state, action, next) => {
  const newState = next();
  console.log('New to-do list', newState.toDos);
  return newState;
});

```

Enhancer takes another parameter ``next`` which calls next enhancer in the chain or final reducer.
```next``` takes up to two parameters ``newState`` and ``newAction``. These will be passed as ``state`` or ``action``
to the reducer or another enhancer.

From Grocery perspective, enhancer is another reducer, which makes possible to enhance even enhancers. First, 
``enhanceReducer`` must take third argument as name for the enhancer. Then you can enhance the enhancer in another module.

THis example shows how to use ``next`` to change ``ADD_TODO`` action when its payload is ``'test'``:
```javascript

import MyGrocery, { ADD_TODO, REDUCER_BASE_TODO } from './groceries/MyGrocery';

MyGrocery.enhanceReducer(REDUCER_BASE_TODO, (state, action, next) => {
  const newState = next(state, action.payload === 'test'
    ? { ...action, payload: 'replaced' }
    : action);
  console.log('New to-do list', newState.toDos);
  return newState;
});

```

### Middlewares

Grocery supports usage of middlewares. Middlewares are called for all groceries in your application. This allows to handle
development or error logging on one place.

```javascript
import { addGroceryMiddleware, addGroceryLogger } from '@zajdasoft/grocery';

addGroceryLogger();
addGroceryMiddleware((grocery, newState, action, next) => {
  next();
});

```

## License

Licensed under L-GPL v. 3.
