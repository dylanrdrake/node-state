import { FlowState } from './FlowState.js';

export class FlowStateComponent extends HTMLElement {
  #flowConfig;
  #flowRoot;
  #flow;

  constructor() {
    super();

    // Capture both open and closed shadow roots created by subclasses.
    const originalAttachShadow = this.attachShadow.bind(this);
    this.attachShadow = (init) => {
      const root = originalAttachShadow(init);
      this.#flowRoot = root;
      return root;
    };

    // Instantiate after subclass constructor work so attachShadow can run first.
    queueMicrotask(() => {
      this.#flowConfig = this.flowConfig ?? {};
      const root = this.#flowRoot ?? this.shadowRoot ?? this;
      this.#flow = new FlowState(root, this.#flowConfig);
    });
  }

  get Flow() {
    return this.#flow;
  }
}