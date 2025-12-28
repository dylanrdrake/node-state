import { NodeState } from './lib/NodeState.js';
import './components/name-input/name-input.js';
import './components/greeting-display/greeting-display.js';
import './components/char-counter/char-counter.js';
import './components/name-history-record/name-history-record.js';

const sheet = new CSSStyleSheet();
const template = document.createElement('template');

const millionNumbers = Array.from({ length: 1000000 }, (_, i) => i + 1);

await fetch(new URL('./app.html', import.meta.url))
  .then(res => res.text())
  .then(html => template.innerHTML = html);

await fetch(new URL('./app.css', import.meta.url))
  .then(res => res.text())
  .then(css => sheet.replaceSync(css))


class TestApp extends HTMLElement {
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

    this.#state = new NodeState(this.shadowRoot, {
      user: {
        name: 'World',
        id: '123',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          country: 'USA',
          zip: '12345'
        }
      },
      changeHistory: [],

      nameCharCount: (state) => state.user.name.length,

      hooks: {
        setName: this.#nameChangeHandler.bind(this),
        reset: this.#resetHandler.bind(this)
      }
    });
  }


  #nameChangeHandler(newName) {
    const timestamp = new Date().toLocaleString();

    this.#state.update((prev) => ({
      user: {
        name: newName,
        id: Date.now().toString()
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
  }


  #resetHandler() {
    this.#state.update({
      user: {
        name: ''
      },
      changeHistory: []
    });
    this.#historyContainer.innerHTML = '';
  }
}

customElements.define('test-app', TestApp);