import { FlowState as Flow } from '../../lib/FlowState.js';
import './side-bar.js';
import './work-view.js';

const CSS = String.raw;
const HTML = String.raw;

const styles = CSS`
  :host {
    display: flex;
    flex-direction: row;
  }
  :host #divider {
    width: 5px;
    background-color: gray;
    cursor: col-resize;
  }
  :host #side-bar-container {
    width: 30%;
    overflow-x: hidden;
    border-right: 2px solid gray;
  }
  :host side-bar {
    display: block;
    min-width: 30vw;
  }
  :host work-view {
    flex-grow: 1;
  }
`

const template = document.createElement('template');
template.innerHTML = HTML`
  <div id="side-bar-container">
    <side-bar></side-bar>
  </div>
  <div id="divider"></div>
  <work-view></work-view>
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);


class Workspace extends HTMLElement {
  #state;
  minWidth = 10;
 
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.divider = this.shadowRoot.getElementById('divider');
    this.sideBarContainer = this.shadowRoot.getElementById('side-bar-container');
    this.workView = this.shadowRoot.querySelector('work-view');
    this.isDragging = false;
    
    this.divider.addEventListener('mousedown', this.#onMouseDown.bind(this));
    document.addEventListener('mousemove', this.#onMouseMove.bind(this));
    document.addEventListener('mouseup', this.#onMouseUp.bind(this));

    this.#state = Flow.create(this.shadowRoot, {
      workItems: null,
      selectedWorkItem: null
    }, {
      selectWorkItem: this.#selectWorkItemHook.bind(this),
      saveWorkItem: this.#saveWorkItem.bind(this)
    });

    this.#state.update({
      workItems: [
        { id: 1, name: 'Work Item 1' },
        { id: 2, name: 'Work Item 2' },
        { id: 3, name: 'Work Item 3' },
        { id: 4, name: 'Work Item 4' },
      ]
    });
  }

  #onMouseDown(e) {
    this.isDragging = true;
    e.preventDefault();
  }

  #onMouseMove(e) {
    if (!this.isDragging) return;
    
    const containerRect = this.getBoundingClientRect();
    const maxWidth = containerRect.width - 150;
    
    if (e.clientX >= this.minWidth && e.clientX <= maxWidth) {
      this.sideBarContainer.style.width = `${e.clientX}px`;
    }
  }

  #onMouseUp() {
    this.isDragging = false;
  }

  #selectWorkItemHook(workItem) {
    this.#state.update({ selectedWorkItem: workItem });
    this.workView.selectedWorkItem = workItem;
  }

  #saveWorkItem(edits) {
    this.#state.update((state) => {
      let updatedItem = { ...state.selectedWorkItem, ...edits };
      const updatedWorkItems = state.workItems.map(item => {
        if (item.id === state.selectedWorkItem.id) {
          return updatedItem;
        }
        return item;
      });
      return {
        workItems: updatedWorkItems,
        selectedWorkItem: updatedItem
      };
    });
  }

}

window.customElements.define('work-space', Workspace);