export class Signal {
  #value;
  #listeners = new Set();

  constructor(initialValue) {
    this.#value = initialValue;
  }

  get() {
    return this.#value;
  }

  set(newValue) {
    this.#value = newValue;
    this.#listeners.forEach(fn => fn(this.#value));
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    fn(this.#value); // run immediately with current value
    return () => this.#listeners.delete(fn);
  }
}
