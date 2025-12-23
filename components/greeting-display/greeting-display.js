const sheet = new CSSStyleSheet();
const template = document.createElement('template');

fetch(new URL('./greeting-display.css', import.meta.url))
  .then(res => res.text())
  .then(css => sheet.replaceSync(css));

fetch(new URL('./greeting-display.html', import.meta.url))
  .then(res => res.text())
  .then(html => template.innerHTML = html);

export class GreetingDisplay extends HTMLElement {
  #greetingSpan;

  static get observedAttributes() {
    return ['name'];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'closed' });
    shadow.adoptedStyleSheets = [sheet];
    shadow.appendChild(template.content.cloneNode(true));
    this.greetingSpan = shadow.querySelector('span.name');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'name') {
      this.greetingSpan.textContent = newValue;
    }
  }
}

customElements.define('greeting-display', GreetingDisplay);
