import { State } from '../../lib/state.js';

const sheet = new CSSStyleSheet();
const template = document.createElement('template');

fetch(new URL('./greeting-display.css', import.meta.url))
  .then(res => res.text())
  .then(css => sheet.replaceSync(css));

fetch(new URL('./greeting-display.html', import.meta.url))
  .then(res => res.text())
  .then(html => template.innerHTML = html);

export class GreetingDisplay extends HTMLElement {
  #state;
  #shadow;
  #greetingSpan;

  static get observedAttributes() {
    return ['name'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'closed' });
    this.#shadow.adoptedStyleSheets = [sheet];
    this.#shadow.appendChild(template.content.cloneNode(true));
    this.#greetingSpan = this.#shadow.querySelector('span.name');

    // README: will overwrite user.name of parent state if shadowroot is closed.
    //         Parent state can't reach through closed shadowRoot to update bindings.
    this.#state = new State(this.#shadow, {
      user: { name: 'Overwrite' }
    });

    // README:
    State.watch(this.#shadow, 'user.name', (newName) => {
      console.log(`GreetingDisplay name: ${newName}`);
    });

    setTimeout(() => {
      // README: updating duplicated key will fire watchers child element watchers
      State.update(this.#shadow, {
        user: { name: 'Overwrite 2' }
      });
    }, 2000);

    // setInterval(() => {
    //   State.update(this.#shadow, {
    //     user: { name: `Time is ${new Date().toLocaleTimeString()}` }
    //   });
    // }, 1000);
  }

  // README: [to-attr] can be used to
  //         1. Get through a closed shadowRoot
  //         2. Overwrite child state with parent state updates
  //            a. Allow partial state keys through
  /*
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`GreetingDisplay to-attr name: ${newValue}`);  
    if (name === 'name') {

      // README: direct update
      // this.greetingSpan.textContent = newValue; 

      // README: updating state with State.update static method in watcher callbacks and attributeChangedCallbacks
      // can cause infinite loops if you update the same key as the to-attr binding you're looking for. You have to
      // update the local state API object directly to avoid this.
      // this.#state.update({
      //   user: { name: newValue }
      // });
    }
  }
  */
}

customElements.define('greeting-display', GreetingDisplay);
