import { NodeState } from '../../lib/NodeState.js';

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

  constructor() {
    super();
    // README: closed shadowRoot will block parent state updates to bindings under this element,
    // bind parent state to [to-attr] of this element and use observedAttributes + attributeChangedCallback to get through
    // and you can direct update dom elements or use an internal state instance and bindings
    this.#shadow = this.attachShadow({ mode: 'closed' }); 
    this.#shadow.adoptedStyleSheets = [sheet];
    this.#shadow.appendChild(template.content.cloneNode(true));

    this.#state = new NodeState(this.#shadow, {
      user: {
        name: 'overwrite',
        id: 123
      }
    });
  }


  static get observedAttributes() {
    return [
      'username',
      'userid',
      'data-user'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Attribute changed: ${name} from ${oldValue} to ${newValue}`);
    if (name === 'username') {
      this.#state.update({
        user: {
          name: newValue
        }
      });
    }
    if (name === 'userid') {
      this.#state.update({
        user: {
          id: newValue
        }
      });
    }
    if (name === 'data-user') {
      console.log('data-user attribute changed:', JSON.parse(newValue));
    }
  }

}

customElements.define('greeting-display', GreetingDisplay);
