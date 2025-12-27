import { State } from './lib/state.js';
import './components/name-input/name-input.js';
import './components/greeting-display/greeting-display.js';
import './components/char-counter/char-counter.js';
import './components/name-history-record/name-history-record.js';

const sheet = new CSSStyleSheet();
const template = document.createElement('template');

await fetch(new URL('./app.html', import.meta.url))
  .then(res => res.text())
  .then(html => template.innerHTML = html);

await fetch(new URL('./app.css', import.meta.url))
  .then(res => res.text())
  .then(css => sheet.replaceSync(css))


class SignalApp extends HTMLElement {
  #state;
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
        id: 0,
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          country: 'USA',
          zip: '12345'
        }
      },
      changeHistory: [],
      userNameCount: (state) => state.user.name.length, // README: computed values have to be pure functions
    });

    
    State.watch(this.shadowRoot, 'user.name', async (newName) => {
      const timestamp = new Date().toLocaleString();
      await State.update(this.shadowRoot, (prev) => ({
        user: { 
          id: Date.now()
        },
        changeHistory: [
          ...prev.changeHistory,
          {
            username: newName,
            timestamp: timestamp
          }
        ]
      }));

      const recordEl = document.createElement('name-history-record');
      recordEl.setAttribute('username', newName);
      recordEl.setAttribute('timestamp', timestamp);
      this.#historyContainer.prepend(recordEl);
    });
  }  
}

customElements.define('signal-app', SignalApp);