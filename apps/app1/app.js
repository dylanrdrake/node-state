import { FlowState as Flow } from '../../lib/FlowState.js';
import './work-space.js';

Flow.devtools();

const CSS = String.raw;
const HTML = String.raw;


const appCSS = CSS`
  :host {
    display: block;
    height: 100vh;
  }

  :host work-space {
    height: 100%;
  }
`;
const appSheet = new CSSStyleSheet();
appSheet.replaceSync(appCSS);

// flow-watch-{key}-to-prop bindings set properties on budget-summary-card elements.
// The value passed is the computed object { total, count, label }.
const appTemplate = document.createElement('template');
appTemplate.innerHTML = HTML`
  <work-space></work-space>
`;


class App1 extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'closed' });
    shadow.appendChild(appTemplate.content.cloneNode(true));
    shadow.adoptedStyleSheets = [appSheet];
  }
}

customElements.define('app-1', App1);
