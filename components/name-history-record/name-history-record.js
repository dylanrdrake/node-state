import { NodeState } from '../../lib/NodeState.js';

const template = document.createElement('template');

fetch(new URL('./name-history-record.html', import.meta.url))
  .then(res => res.text())
  .then(html => template.innerHTML = html);

export class NameHistoryRecord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const name = this.getAttribute('username') || '';
    const timestamp = this.getAttribute('timestamp') || '';

    NodeState.create(this.shadowRoot, {
      name: name,
      timestamp: timestamp
    });
  }
}

customElements.define('name-history-record', NameHistoryRecord);