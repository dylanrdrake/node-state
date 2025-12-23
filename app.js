import { State } from './lib/state.js';
import './components/name-input/name-input.js';
import './components/greeting-display/greeting-display.js';
import './components/char-counter/char-counter.js';

const sheet = new CSSStyleSheet();
const template = document.createElement('template');

await fetch(new URL('./app.html', import.meta.url))
  .then(res => res.text())
  .then(html => template.innerHTML = html),

await fetch(new URL('./app.css', import.meta.url))
  .then(res => res.text())
  .then(css => sheet.replaceSync(css))


class SignalApp extends HTMLElement {
  #state;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Use constructor directly to get immediate access to State instance
    // this.#state = new State(this.shadowRoot, {
    //   name: 'World',
    //   count: (state) => state.name.length
    // });

    // Update state before ready. Throws error
    // this.#state.update({ name: 'Signal1' });                // Throws an error because not ready
    // State.update(this.shadowRoot, { name: 'Signal1' });    // The static update method waits for ready

    // this.#state.ready.then(() => {
      // State.update(this.shadowRoot, { name: 'Signal2' });
    // })
  }

  async connectedCallback() {
    State.create(this.shadowRoot, {
      name: 'World',
      count: (state) => state.name.length
    })
    .then((state) => {
      this.#state = state;
    });

    State.update(this.shadowRoot, { name: 'Signal3' });
  }
}

customElements.define('signal-app', SignalApp);


// Mount to #app element
const appRoot = document.getElementById('app');
if (appRoot) {
  appRoot.appendChild(document.createElement('signal-app'));
}