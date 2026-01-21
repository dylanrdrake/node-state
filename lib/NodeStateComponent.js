import { NodeState } from '../lib/NodeState.js';


export class N$Component extends HTMLElement {
  #root;
  #state;
  
  constructor(htmlStr, cssStr, shadowDOM) {
    super();
    const template = document.createElement('template');
    template.innerHTML = htmlStr;
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssStr);

    if (shadowDOM) {
      this.#root = this.attachShadow(shadowDOM);
    } else {
      this.#root = this;
    }

    this.#root.adoptedStyleSheets = [sheet];
    this.#root.appendChild(template.content.cloneNode(true));

    let N$ = {};

    Object.defineProperty(N$, 'create', {
      value: this.#N$Create.bind(this),
      writable: false,
      enumerable: true,
      configurable: false
    });

    Object.defineProperty(N$, 'watch', {
      value: NodeState.watch.bind(undefined, this.#root),
      writable: false,
      enumerable: true,
      configurable: false
    });

    Object.defineProperty(N$, 'get', {
      value: NodeState.get.bind(undefined, this.#root),
      writable: false,
      enumerable: true,
      configurable: false
    });

    Object.defineProperty(N$, 'hasKey', {
      value: this.#N$HasKey.bind(this),
      writable: false,
      enumerable: true,
      configurable: false
    });

    this.N$ = N$;
  }

  #N$Create(stateConfig) {
    this.#state = NodeState.create(this.#root, stateConfig);
    return this.#state;
  }

  #N$HasKey(key) {
    if (this.#state) return  this.#state.hasKey(key);
    return undefined;
  }
}