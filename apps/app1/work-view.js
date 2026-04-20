import { FlowState as Flow } from '../../lib/FlowState.js';

const CSS = String.raw;
const HTML = String.raw;

const styles = CSS`
  :host {
    display: flex;
    flex-direction: row;
  }

  :host #work-view {
    padding: 1vh;
  }
`;

const noSelectedItemMsg = 'No work item selected...';

const template = document.createElement('template');
template.innerHTML = HTML`
  <div id="work-view">
    <div id="no-selected-item-msg">${noSelectedItemMsg}</div>
    <div id="editor">
      <div id="editor-fields"></div>
      <button id="save-btn">Save</button>
      <button id="close-btn">Close</button>
    </div>
  </div>
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class WorkView extends HTMLElement {
  #state;
  #workView;
  #noItemMsg;
  #editor;
  #editorFields;
  #saveBtn;
  #closeBtn;
  #saveWorkItem;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.#workView = this.shadowRoot.getElementById('work-view');
    this.#noItemMsg = this.shadowRoot.getElementById('no-selected-item-msg');
    this.#editor = this.shadowRoot.getElementById('editor');
    this.#editorFields = this.shadowRoot.getElementById('editor-fields');
    this.#saveBtn = this.shadowRoot.getElementById('save-btn');
    this.#closeBtn = this.shadowRoot.getElementById('close-btn');

    Flow.get(this.shadowRoot, 'saveWorkItem', (fn) => this.#saveWorkItem = fn);

    this.#saveBtn.addEventListener('click', () => {
      if (this.#saveWorkItem) {
        const edits = this.#state.get('edits');
        this.#saveWorkItem(edits);
      }
    });

    this.#closeBtn.addEventListener('click', () => {
      this.selectedWorkItem = null;
      this.#state.update({ edits: {} });
    });

    this.#state = Flow.create(this.shadowRoot, {
      edits: null
    });
  }

  set selectedWorkItem(workItem) {
    this.#state.update({ edits: workItem || {} });
    this.#editorFields.innerHTML = ''; // clear previous inputs

    if (!workItem) {
      this.#noItemMsg.style.display = 'block';
      this.#editor.style.display = 'none';
      return;
    }

    this.#noItemMsg.style.display = 'none';
    this.#editor.style.display = 'block';
    // build inputs 
    Object.entries(workItem).forEach(([key, value]) => {
      let input = document.createElement('input');
      input.value = value;
      this.#editorFields.appendChild(input);
      input.addEventListener('input', (e) => {
        let value = e.target.value;
        this.#state.update((state) => {
          state.edits[key] = value;
          return state;
        });
      });
    });
  }
}

customElements.define('work-view', WorkView);