# State.js

A lightweight reactive state management library for vanilla JavaScript and Web Components.

## Features

- **Reactive bindings** - Automatically update DOM elements when state changes
- **Computed properties** - Derive values from state that auto-update
- **Deep shadow DOM support** - Works with nested Web Components
- **Functional updates** - Access current state when emitting changes
- **Zero dependencies** - Pure vanilla JavaScript

## Installation

```javascript
import { State } from './lib/state.js';
```

## Basic Usage

### Creating State

State binds to a root element and listens for state update events and the looks for `bind-state` and `to-prop` attributes in the DOM below itself (including itself).

```javascript
const state = new State(document.getElementById('app'), {
  name: 'World',
  count: 0
});
```

### Binding to DOM Elements

Use `bind-state` to specify which state key to bind, and `to-prop` to specify which element property to update:

```html
<div id="app">
  <h1 bind-state="name" to-prop="textContent">Default</h1>
  <span bind-state="count" to-prop="textContent">0</span>
</div>
```

### Updating State

Use `State.update()` to update state from anywhere in your app:

```javascript
// Direct update
State.update(element, { name: 'Alice', count: 5 });

// Functional update - receives current state
State.update(element, (state) => ({
  count: state.count + 1
}));
```

The event bubbles up to the root element, so `element` can be any descendant of the state root.

### Computed Properties

Pass functions in the config to create computed properties that auto-update when dependencies change:

```javascript
const state = new State(document.getElementById('app'), {
  firstName: 'John',
  lastName: 'Doe',
  fullName: (values) => `${values.firstName} ${values.lastName}`
});
```

---

## Plain JavaScript Example

### HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>State.js Counter</title>
</head>
<body>
  <div id="app">
    <h1>Hello, <span bind-state="name" to-prop="textContent">World</span>!</h1>
    
    <p>Count: <span bind-state="count" to-prop="textContent">0</span></p>
    <p>Double: <span bind-state="double" to-prop="textContent">0</span></p>
    
    <input type="text" id="name-input" placeholder="Enter name">
    <button id="increment">+1</button>
    <button id="decrement">-1</button>
  </div>

  <script type="module" src="app.js"></script>
</body>
</html>
```

### JavaScript

```javascript
import { State } from './lib/state.js';

const state = new State(document.getElementById('app'), {
  name: 'World',
  count: 0,
  double: (values) => values.count * 2
});

// Update name from input
document.getElementById('name-input').addEventListener('input', (e) => {
  State.update(e.target, { name: e.target.value });
});

// Increment with functional update
document.getElementById('increment').addEventListener('click', (e) => {
  State.update(e.target, (state) => ({ count: state.count + 1 }));
});

// Decrement with functional update
document.getElementById('decrement').addEventListener('click', (e) => {
  State.update(e.target, (state) => ({ count: state.count - 1 }));
});
```

---

## Web Components Example

State.js works seamlessly with Web Components and Shadow DOM.

### Main App (app.js)

```javascript
import { State } from './lib/state.js';
import './components/name-input/name-input.js';
import './components/greeting-display/greeting-display.js';

// Use State.create() for async initialization (waits for element to exist)
const state = await State.create('app', {
  name: '',
  count: 0,
  greeting: (values) => values.name ? `Hello, ${values.name}!` : 'Enter your name'
});
```

### HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>Web Components Example</title>
</head>
<body>
  <div id="app">
    <name-input></name-input>
    <greeting-display></greeting-display>
  </div>

  <script type="module" src="app.js"></script>
</body>
</html>
```

### Name Input Component

**name-input.html**
```html
<label>
  Name: 
  <input type="text" id="input" bind-state="name" to-prop="value">
</label>
<p>Characters: <span bind-state="count" to-prop="textContent">0</span></p>
```

**name-input.js**
```javascript
import { State } from '../../lib/state.js';

const template = document.createElement('template');
template.innerHTML = `<!-- load from name-input.html -->`;

export class NameInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = template.innerHTML;

    const input = this.shadowRoot.querySelector('#input');
    input.addEventListener('input', (e) => {
      State.update(this, {
        name: e.target.value,
        count: e.target.value.length
      });
    });
  }
}

customElements.define('name-input', NameInput);
```

### Greeting Display Component

**greeting-display.html**
```html
<h2 bind-state="greeting" to-prop="textContent">Enter your name</h2>
```

**greeting-display.js**
```javascript
const template = document.createElement('template');
template.innerHTML = `<!-- load from greeting-display.html -->`;

export class GreetingDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = template.innerHTML;
  }
}

customElements.define('greeting-display', GreetingDisplay);
```

---

## API Reference

### `new State(root, config)`

Creates a new state instance synchronously.

- **root** - DOM element or element ID string (must exist)
- **config** - Object with state values and computed functions

### `State.create(root, config)` (async)

Creates a new state instance asynchronously. Waits for the element to exist if `root` is a string ID.

Returns a State instance with a `ready` promise.

```javascript
const state = await State.create('app', { count: 0 });
// or
const state = State.create('app', { count: 0 });
await state.ready;
```

### `State.update(element, detail)`

Dispatches a state update event.

- **element** - Any element within the state root (event bubbles up)
- **detail** - Object with state updates, or a function `(currentState) => updates`

```javascript
// Direct update
State.update(button, { count: 10 });

// Functional update (access current state)
State.update(button, (state) => ({ count: state.count + 1 }));
```

---

## HTML Attributes

### `bind-state`

Specifies which state key this element is bound to.

```html
<span bind-state="count">0</span>
```

### `to-prop`

Specifies which DOM property to update when state changes.

```html
<span bind-state="count" to-prop="textContent">0</span>
<input bind-state="name" to-prop="value">
<div bind-state="isVisible" to-prop="hidden">
```

---

## Nested States

You can have multiple State instances in your application, each managing its own scope. State emission events bubble up through the DOM, so child states can be nested within parent states.

### How It Works

When `State.update()` is called, the event bubbles up and is handled by the **first** State root it encounters. This allows components to have their own isolated state while still being able to participate in a parent state if needed.

```
┌─────────────────────────────────────────┐
│  #app (Parent State)                    │
│  - name, count, greeting                │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  <my-widget> (Child State)        │  │
│  │  - localCount, isExpanded         │  │
│  │                                   │  │
│  │  Emits here → handled by Child    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Emits here → handled by Parent         │
└─────────────────────────────────────────┘
```

### Example: Component with Local State

A component can manage its own local state independently from the parent:

```javascript
// Parent app state
const appState = await State.create('app', {
  user: 'Guest',
  theme: 'light'
});

// Child component with its own state
class ExpandablePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <div class="panel">
        <button id="toggle" bind-state="buttonText" to-prop="textContent">Expand</button>
        <div bind-state="isExpanded" to-prop="hidden">
          <slot></slot>
        </div>
      </div>
    `;
    
    // Local state scoped to this component's shadow root
    this.#state = new State(this.shadowRoot, {
      isExpanded: true,  // hidden="true" hides the element
      buttonText: 'Expand'
    });
    
    this.shadowRoot.querySelector('#toggle').addEventListener('click', () => {
      State.update(this.shadowRoot, (state) => ({
        isExpanded: !state.isExpanded,
        buttonText: state.isExpanded ? 'Expand' : 'Collapse'
      }));
    });
  }
}
```


### Key Points

1. **Scope isolation** - Each State only updates bindings within its own root element
2. **Event bubbling** - Emissions bubble up, handled by the nearest State root
3. **Shadow DOM boundaries** - Events cross shadow boundaries (`composed: true`)
4. **Independent configs** - Each State can have different keys; they don't need to match

---

## Tips

1. **Use functional update** when you need to reference current state values to avoid stale data
2. **Computed properties** automatically update when any state value changes
3. **State.create()** is preferred for top-level app state as it handles timing issues
4. **Events bubble** through shadow DOM boundaries thanks to `composed: true`
5. **Nested states** allow components to manage local state while participating in parent state
