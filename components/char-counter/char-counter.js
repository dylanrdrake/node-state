import { State } from "../../lib/state.js";

const sheet = new CSSStyleSheet();
const template = document.createElement('template');

fetch(new URL('./char-counter.css', import.meta.url))
  .then(res => res.text())
  .then(css => sheet.replaceSync(css));

fetch(new URL('./char-counter.html', import.meta.url))
  .then(res => res.text())
  .then(html => template.innerHTML = html);

export class CharCounter extends HTMLElement {
  #clearButton;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this.shadowRoot.innerHTML = template.innerHTML;

    this.#clearButton = this.shadowRoot.querySelector('#clear-btn');
    this.#clearButton.addEventListener('click', this.clearBtnClicked.bind(this));

    State.create(this.shadowRoot, {
      clearCount: 0,
      clearCountLabel: this.clearCountLabel, // README: computed value functions have to be pure
    });

    State.watch(this.shadowRoot, 'user.name', this.userNameChanged.bind(this));

    State.watch(this.shadowRoot, 'count', this.countChanged.bind(this));

    State.watch(this.shadowRoot, 'clearCount', this.clearCountChanged.bind(this));
  }

  userNameChanged(newName) {
    console.log(`CharCounter name: ${newName}`);
  }

  countChanged(newCount) {
    let oddEvenTemplateId = newCount % 2 === 0 ? 'even-span-temp' : 'odd-span-temp';
    let oddEvenTemplate = this.shadowRoot.querySelector(`#${oddEvenTemplateId}`);
    const oddEvenClone = document.importNode(oddEvenTemplate.content, true);
    const countSpan = this.shadowRoot.getElementById('odd-even-span');
    countSpan.innerHTML = '';
    countSpan.appendChild(oddEvenClone);
  }

  clearCountChanged(newCount) {
    console.log(`clearCount: ${newCount}`);
  }

  // clearCountLabel = (state) => `Clear (${state.clearCount})`;
  clearCountLabel(state) {
    console.log('clearCountLabel recomputed', state.clearCount);
    return `Clear (${state.clearCount})`;
  }

  clearBtnClicked(e) {
    State.update(this.shadowRoot, (prev) => ({
      user: {
        name: ''
      },
      clearCount: prev.clearCount + 1
    }));
  }
}

customElements.define('char-counter', CharCounter);