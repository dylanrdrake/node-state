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
  #shadow;
  #state;

  constructor() {
    super();
    // README: closed shadowRoot will block parent state updates to bindings under this element,
    // bind parent state to [to-attr] of this element and use observedAttributes + attributeChangedCallback to get through
    // and you can direct update dom elements or use an internal state instance and bindings
    this.#shadow = this.attachShadow({ mode: 'closed' }); 
    this.#shadow.adoptedStyleSheets = [sheet];
    this.#shadow.appendChild(template.content.cloneNode(true));

    State.create(this.#shadow, {
      user: {
        name: 'overwrite',
        id: 0
      }
    }).then((stateInstance) => {
      this.#state = stateInstance;
    });
  }

  static get observedAttributes() {
    return ['userid'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'userid' && this.#state) {
      this.#state.update({
        user: {
          id: newValue // propagate the bound attribute value to internal state to get through closed shadowroot
        }
      });
    }
  }

}

customElements.define('greeting-display', GreetingDisplay);
