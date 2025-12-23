export class State {
  #root;
  #values = {};
  #computed = {};
  #keys = [];
  #computedKeys = [];
  #resolveReady; // Function to resolve the public ready promise
  ready;         // Public promise that resolves when state is ready

  constructor(root, config = {}) {
    let readyResolve;
    // This state
    let thisReady = new Promise((resolve) => {
      readyResolve = resolve;
    });
    // This state + any parents' states
    this.ready = Promise.all([
      thisReady,
      ...State.#parentStatesReady(root, config)
    ])
    .finally(() => {
      this.update = this.#publicUpdateReady;
    });
    this.#resolveReady = readyResolve;

    // Separate values from computed (functions)
    const entries = Object.entries(config);
    const valueEntries = entries.filter(([, v]) => typeof v !== 'function');
    const computedEntries = entries.filter(([, v]) => typeof v === 'function');

    this.#keys = valueEntries.map(([k]) => k);
    this.#computedKeys = computedEntries.map(([k]) => k);

    // Store computed functions
    this.#computed = Object.fromEntries(computedEntries);

    // Create public getters for value keys
    this.#keys.forEach(key => {
      Object.defineProperty(this, key, {
        get: () => this.#values[key],
        enumerable: true
      });
    });

    // Set initial values
    valueEntries.forEach(([key, value]) => {
      this.#values[key] = value;
    });

    // Create public getters for computed keys
    this.#computedKeys.forEach(key => {
      Object.defineProperty(this, key, {
        get: () => this.#computed[key](this.#values),
        enumerable: true
      });
    });

    Promise.resolve().then(() => { // Makes Web Components to work. Ensures children are ready.
      // If root provided, bind immediately
      if (root) {
        // Expose state instance on root for static access
        root.__state__ = this;

        this.#bindToRoot(root);
        this.#resolveReady();
      }
    });

    return this;
  }

  static #waitForElement(id) {
    return new Promise((resolve) => {
      const el = document.getElementById(id);
      if (el) {
        return resolve(el);
      }

      const observer = new MutationObserver(() => {
        const el = document.getElementById(id);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  #bindToRoot(root) {
    this.#root = root;

    // Set initial values and update bindings
    this.#keys.forEach(key => {
      this.#updateBindings(key, this.#values[key]);
    });

    // Set initial computed values
    this.#computedKeys.forEach(key => {
      this.#updateBindings(key, this.#computed[key](this.#values));
    });

    root.addEventListener('state-emission', this.#update.bind(this));
  }

  #querySelectorAllDeep(selector, root = this.#root) {
    const results = [...root.querySelectorAll(selector)];
    
    // Search in shadow roots of all elements
    const elements = root.querySelectorAll('*');
    elements.forEach(el => {
      if (el.shadowRoot) {
        results.push(...this.#querySelectorAllDeep(selector, el.shadowRoot));
      }
    });
    
    return results;
  }

  #update(e) {
    let updates = e.detail || {};

    // Provide current state if update is a function
    if (typeof e.detail === 'function') {
      updates = e.detail({ ...this.#values });
    }

    let updated = {}
    
    Object.keys(updates).forEach(key => {
      this.#values[key] = updates[key];
      updated[key] = updates[key];
    });

    // Update all computed values when any state changes
    this.#computedKeys.forEach(key => {
      updated[key] = this.#computed[key](this.#values);
    });

    Object.entries(updated).forEach(([key, value]) => {
      this.#updateBindings(key, value);
    });
  }

  #updateBindings(key, value) {
    const selector = `[bind-state="${key}"]`;
    let bindings = this.#querySelectorAllDeep(selector);

    // Include the root itself if it matches
    if (this.#root && this.#root.matches && this.#root.matches(selector)) {
      bindings = [this.#root, ...bindings];
    }

    bindings.forEach(el => {
      const prop = el.getAttribute('to-prop');
      if (prop) {
        el[prop] = value;
      }
      const attr = el.getAttribute('to-attr');
      if (attr) {
        el.setAttribute(attr, value);
      }
    });
  }


  #publicUpdateReady(update) {
    this.#update({ detail: update });
  }

  // Private static method: searches parent lineage for elements with public getters matching update keys
  static #parentStatesReady(element, update) {
    let updateKeys = Object.keys(update);
    let el = element;
    const readyPromises = [];
    while (el) {
      if (el.__state__) {
        for (const key of updateKeys) {
          // Check if the state instance has a public getter for this key
          const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el.__state__), key);
          if (descriptor && typeof descriptor.get === 'function') {
            // Collect the readiness promise (if available)
            if (el.__state__.ready && typeof el.__state__.ready.then === 'function') {
              readyPromises.push(el.__state__.ready);
            }
          }
        }
      }
      el = el.parentNode;
    }

    return readyPromises;
  }


  /****  Public API ****/

  // Direct update without event when the calling code has direct access to the State instance
  // Will be replaced when ready
  update() {
    throw Error("Unable to update state before ready!");
  };

  // Emit update event shorthand to use from a child element within the Scope.
  // Can import State to utilize this static method to ensure a wait for ready parent states.
  static async update(element, detail) {
    await Promise.all(State.#parentStatesReady(element, detail));
    element.dispatchEvent(new CustomEvent('state-emission', {
      detail,
      bubbles: true,
      composed: true
    }));
  };

  static async create(root, config = {}) {
    // If root is a string, wait for the element to exist
    if (typeof root === 'string') {
      let el = await State.#waitForElement(root);
      const state = new State(null, config);
      state.#bindToRoot(el);
      state.#resolveReady();
      return state;
    } else {
      const state = new State(root, config);
      state.#resolveReady();
      return state;
    }
  }
}