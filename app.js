import { State } from './lib/state.js';
import './components/name-input/name-input.js';
import './components/greeting-display/greeting-display.js';
import './components/char-counter/char-counter.js';
import './components/name-history-record/name-history-record.js';

const sheet = new CSSStyleSheet();
const template = document.createElement('template');

await fetch(new URL('./app.html', import.meta.url))
  .then(res => res.text())
  .then(html => template.innerHTML = html),

await fetch(new URL('./app.css', import.meta.url))
  .then(res => res.text())
  .then(css => sheet.replaceSync(css))


class SignalApp extends HTMLElement {
  #testPerfBtn;
  #historyContainer;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.#testPerfBtn = this.shadowRoot.getElementById('test-perf-btn');
    this.#historyContainer = this.shadowRoot.getElementById('name-history');

    State.create(this.shadowRoot, {
      user: {
        name: 'World',
        id: 0
      },
      count: (state) => state.user.name.length,
    });

    State.watch(this.shadowRoot, 'user.name', (newValue) => {
      console.log('App name changed:', newValue);
      const timestamp = new Date().toLocaleTimeString();
      const record = document.createElement('name-history-record');
      record.setAttribute('username', newValue);
      record.setAttribute('timestamp', ` at ${timestamp}`);
      this.#historyContainer.prepend(record);
    });

    this.#testPerfBtn.addEventListener('click', () => {
      State.update(this.shadowRoot, {
        user: { id: `id-${Date.now()}` }
      });
    });
  }  
}

customElements.define('signal-app', SignalApp);


// Mount to #app element
const appRoot = document.getElementById('app');
if (appRoot) {
  appRoot.appendChild(document.createElement('signal-app'));
}