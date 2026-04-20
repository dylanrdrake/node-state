import { FlowState as Flow } from '../../lib/FlowState.js';

const CSS = String.raw;
const HTML = String.raw;

const styles = CSS`
  :host {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  :host #work-items-container .work-item,
  :host #work-history .work-item {
    padding: 8px;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
  }

  :host #work-items-container .work-item:hover,
  :host #work-history .work-item:hover {
    background-color: #f0f0f0;
    cursor: pointer;
  }

  :host #work-items-container .work-item.selected,
  :host #work-history .work-item.selected {
    background-color: #d0d0d0;
  } 
`;

const template = document.createElement('template');
template.innerHTML = HTML`
  <div id="work-items-container"></div>
  <div>
    <div><b>Recent:</b></div>
    <div id="work-history"></div>
  </div>
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class SideBar extends HTMLElement {
  #state;
  #selectWorkItem;
  #selectedWorkItem;
  #workItemsContainer;
  #workHistoryContainer;


  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.#workItemsContainer = this.shadowRoot.getElementById('work-items-container');
    this.#workHistoryContainer = this.shadowRoot.getElementById('work-history');

    Flow.get(this.shadowRoot, 'selectWorkItem', (fn) => this.#selectWorkItem = fn);

    Flow.watch(this.shadowRoot, 'selectedWorkItem', this.#workItemSelected.bind(this));

    Flow.watch(this.shadowRoot, 'workItems', this.#renderWorkItems.bind(this));

    this.#state = Flow.create(this.shadowRoot, {
      history: [],
    });

    this.#state.watch('history', this.#renderWorkHistory.bind(this));
  }


  #renderWorkItems(workItems) {
    if (!workItems) {
      this.#workItemsContainer.textContent = 'No work items';
      return;
    }
    this.#workItemsContainer.innerHTML = '';
    workItems.forEach((item) => {
      const div = document.createElement('div');
      div.textContent = item.name;
      div.setAttribute('data-work-item-id', item.id);
      if (this.#selectedWorkItem && item.id === this.#selectedWorkItem.id) {
        div.classList.add('selected');
      }
      else {
        div.classList.remove('selected');
      }
      div.classList.add('work-item');
      div.addEventListener('click', () => this.#selectWorkItem(item));
      this.#workItemsContainer.appendChild(div);
    });
  }


  #workItemSelected(workItem) {
    this.#selectedWorkItem = workItem;
    if (workItem) {
      this.#state.update((prev) => {
        const newHistory = [workItem, ...prev.history.filter(item => item.id !== workItem.id)];
        return { history: newHistory };
      });
    }
    this.#visuallySelectWorkItem(workItem);
  }


  #visuallySelectWorkItem(workItem) {
    const workItemElements = this.#workItemsContainer.querySelectorAll('.work-item');
    workItemElements.forEach((el) => {
      const workItemId = parseInt(el.getAttribute('data-work-item-id'));
      if (workItem && workItemId === workItem.id) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  #renderWorkHistory(history) {
    if (!history || history.length === 0) {
      this.#workHistoryContainer.textContent = 'No recent work items';
      return;
    }
    this.#workHistoryContainer.innerHTML = '';
    history.forEach((item) => {
      const div = document.createElement('div');
      div.textContent = item.name;
      div.classList.add('work-item');
      div.setAttribute('data-work-item-id', item.id);
      div.addEventListener('click', () => this.#selectWorkItem(item));
      this.#workHistoryContainer.appendChild(div);
    });
  }
}

customElements.define('side-bar', SideBar); 