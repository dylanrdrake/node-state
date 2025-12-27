let watchers = []
let state = {}

export let StateFlow = {

  // config: (configuredState) => {
  //   Object.assign(this, configuredState);
  // },

  // get: (keyPath) => {
  //   let current;
  //   const keys = keyPath.split('.');
  //   for (const key of keys) {
  //     if (current && key in current) {
  //       current = current[key];
  //     } else {
  //       current = undefined;
  //       break;
  //     }
  //   }
  //   if (current instanceof Function) {
  //     return current(this);
  //   }
  //   return current;
  // },

  register: (updates) => {
    const merge = (target, src) => {
      for (const k in src) {
        if (k === 'update' || k === 'watch') {
          continue;
        }
        if (
          typeof src[k] === 'object' && src[k] !== null && !Array.isArray(src[k]) &&
          typeof target[k] === 'object' && target[k] !== null && !Array.isArray(target[k])
        ) {
          merge(target[k], src[k]);
        } else if (typeof src[k] === 'function') {
          // If value is a function, treat as computed and execute with 'this' as param
          target[k] = src[k](updates);
        } else {
          target[k] = src[k];
        }
      }
    };

    merge(state, updates);

    console.log('StateFlow updated', updates);

    // Notify watchers
    watchers.map((w) => w(state));

    // Update bindings
    // do
  },

  watch: (callback) => {
    const unsub = () => {
      watchers = watchers.filter((cb) => cb !== callback);
    }
    watchers.push(callback);
    callback(state);
    return unsub;
  }

}


// #updateBindings(key) {
//   let value;
//   if (this.#computed[key]) {
//     value = this.#computed[key](this.#values);
//   } else {
//     value = key.split('.').reduce((o, k) => o?.[k], this.#values);
//   }

//   const selector = `[bind-state="${key}"]`;
//   let bindings = this.#querySelectorAllDeep(selector);

//   // Include the root itself if it matches
//   if (this.#root && this.#root.matches && this.#root.matches(selector)) {
//     bindings = [this.#root, ...bindings];
//   }

//   bindings.forEach(el => {
//     let hasOverwritingState = this.#hasOverwritingState(this.#root, el);
//     if (hasOverwritingState && hasOverwritingState.hasKey(key)) {
//       // Skip elements that have an overwriting state in between
//       return;
//     }
//     const prop = el.getAttribute('to-prop');
//     if (prop) {
//       el[prop] = value;
//     }
//     const attr = el.getAttribute('to-attr');
//     if (attr) {
//       el.setAttribute(attr, value);
//     }
//   });
// }

