import { NodeState } from "../../lib/NodeState.js";

const sheet = new CSSStyleSheet();
const template = document.createElement('template');

fetch(new URL('./char-counter.css', import.meta.url))
  .then(res => res.text())
  .then(css => sheet.replaceSync(css));

fetch(new URL('./char-counter.html', import.meta.url))
  .then(res => res.text())
  .then(html => template.innerHTML = html);

export class CharCounter extends HTMLElement {
  #clearBtn;
  #reset;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this.shadowRoot.innerHTML = template.innerHTML;
    this.#clearBtn = this.shadowRoot.getElementById('clear-btn');

    NodeState.get(this.shadowRoot, 'hooks.reset').then((resetHook) => {
      this.#reset = resetHook;
      this.#clearBtn.addEventListener('click', this.#reset);
    });
  }
}

customElements.define('char-counter', CharCounter);