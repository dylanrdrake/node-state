const CSS = String.raw;
const HTML = String.raw;

const styles = CSS`
  :host {
    overflow: auto;
  }
`
const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);


// Faster than setting innerHTML. Creates pre-parsed nodes once at startup
// instead of reparsing HTML strings on each instantiation.
const template = document.createElement('template');
template.innerHTML = HTML`
  <div id="message"></div>
`;


export class LogEntry extends HTMLElement {
  #messageDiv;
 
  constructor(entry) {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.#messageDiv = this.shadowRoot.getElementById('message');
    this.#messageDiv.textContent = `${entry.user.name} ${entry.message}`;
  }

}

window.customElements.define('log-entry', LogEntry);