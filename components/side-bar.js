import { NodeState as N$ } from '../lib/NodeState.js';


const CSS = String.raw;
const HTML = String.raw;


const styles = CSS`
  :host {
  }
`;
const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);


const template = document.createElement('template');
template.innerHTML = HTML`
  <button id="add-btn">Add</button>
  <button id="clear-btn">Clear</button>
  <div ns-bind-itemCount-to-prop="innerHTML"></div>
`;


class SideBar extends HTMLElement {
  #addBtn;
  #clearBtn;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.#addBtn = this.shadowRoot.getElementById('add-btn');
    this.#clearBtn = this.shadowRoot.getElementById('clear-btn');

    N$.get(this.shadowRoot, 'clearItems').then(clearItems => {
      this.#clearBtn.addEventListener('click', clearItems);
    });

    N$.get(this.shadowRoot, 'addItem').then(addItem => {
      this.#addBtn.addEventListener('click', addItem);
    });
  }
}

window.customElements.define('side-bar', SideBar);