import { FlowState, FlowStateComponent } from 'flow-state';
import './kanban-column.js';

FlowState.devtools();

const HTML = String.raw;
const CSS = String.raw;

let nextId = 100;
const uid = () => ++nextId;

const INITIAL_COLUMNS = [
  {
    id: 'backlog',
    title: 'Backlog',
    cards: [
      { id: uid(), title: 'Research competitors',   desc: 'Survey top 5 competitors and summarise findings.' },
      { id: uid(), title: 'Define personas',         desc: 'Create 3 user personas based on interview notes.' },
      { id: uid(), title: 'Write API spec',          desc: 'Draft OpenAPI 3 spec for the new endpoints.' },
    ],
  },
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      { id: uid(), title: 'Design system tokens',   desc: 'Export colour and spacing tokens from Figma.' },
      { id: uid(), title: 'Set up CI pipeline',     desc: 'GitHub Actions: lint, test, build on every PR.' },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    cards: [
      { id: uid(), title: 'Auth flow',              desc: 'Implement OAuth 2 PKCE flow with refresh tokens.' },
      { id: uid(), title: 'Dashboard layout',       desc: 'Responsive grid scaffold for the main dashboard.' },
    ],
  },
  {
    id: 'review',
    title: 'In Review',
    cards: [
      { id: uid(), title: 'Onboarding screens',     desc: 'Three-step onboarding wizard — awaiting design sign-off.' },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      { id: uid(), title: 'Project kickoff',        desc: 'Kickoff meeting held, goals aligned, repo created.' },
      { id: uid(), title: 'Repo scaffolding',       desc: 'Monorepo set up with workspaces and shared config.' },
    ],
  },
];

class KanbanApp extends FlowStateComponent {
  shadowMode = 'open';

  styles = CSS`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0f172a;
      color: #e2e8f0;
      font-family: system-ui, sans-serif;
    }

    header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      border-bottom: 1px solid #1e293b;
      flex-shrink: 0;
    }

    header h1 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #f1f5f9;
      letter-spacing: -0.3px;
    }

    .add-card-form {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }

    .add-card-form select {
      padding: 6px 10px;
      border-radius: 7px;
      border: 1px solid #334155;
      background: #1e293b;
      color: #e2e8f0;
      font: inherit;
      font-size: 13px;
    }

    .add-card-form input {
      padding: 6px 10px;
      border-radius: 7px;
      border: 1px solid #334155;
      background: #1e293b;
      color: #e2e8f0;
      font: inherit;
      font-size: 13px;
      width: 200px;
    }

    .add-card-form input::placeholder { color: #64748b; }

    .add-card-form button {
      padding: 6px 14px;
      border-radius: 7px;
      border: none;
      background: #6366f1;
      color: #fff;
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .add-card-form button:hover { background: #4f46e5; }

    .board {
      display: flex;
      flex-direction: row;
      gap: 16px;
      padding: 20px 24px;
      overflow-x: auto;
      flex: 1;
      align-items: flex-start;
    }

    .board::-webkit-scrollbar { height: 6px; }
    .board::-webkit-scrollbar-track { background: transparent; }
    .board::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
  `;

  template = HTML`
    <header>
      <h1>Kanban Board</h1>
      <div class="add-card-form">
        <input id="card-title-input" type="text" placeholder="New card title…" />
        <select id="column-select"></select>
        <button id="add-card-btn">+ Add Card</button>
      </div>
    </header>
    <div class="board" id="board"></div>
  `;

  flowConfig = {
    init: {
      columns: INITIAL_COLUMNS,
      selectedCard: null,
    },
    hooks: {
      moveCard:   (...args) => this.#moveCard(...args),
      deleteCard: (...args) => this.#deleteCard(...args),
      selectCard: (...args) => this.#selectCard(...args),
    },
    options: { label: 'KanbanApp' },
  };

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();

    const shadow = this.shadowRoot;
    const board = shadow.getElementById('board');
    const addBtn = shadow.getElementById('add-card-btn');
    const titleInput = shadow.getElementById('card-title-input');
    const colSelect = shadow.getElementById('column-select');

    // Populate column selector and render columns
    this.state.watch('columns', (columns) => {
      // Sync column selector options
      const prev = colSelect.value;
      colSelect.innerHTML = columns.map(c =>
        `<option value="${c.id}">${c.title}</option>`
      ).join('');
      if (prev) colSelect.value = prev;

      // Sync kanban-column elements
      const existing = new Map(
        [...board.querySelectorAll('kanban-column')].map(el => [el.dataset.columnId, el])
      );

      // Remove columns that no longer exist
      for (const [id, el] of existing) {
        if (!columns.find(c => c.id === id)) el.remove();
      }

      // Add or update columns in order
      columns.forEach((col, i) => {
        let el = existing.get(col.id);
        if (!el) {
          el = document.createElement('kanban-column');
          el.dataset.columnId = col.id;
          board.appendChild(el);
        }
        // Move to correct position if needed
        if (board.children[i] !== el) board.insertBefore(el, board.children[i]);
      });
    });

    addBtn.addEventListener('click', () => {
      const title = titleInput.value.trim();
      if (!title) return;
      this.#addCard(colSelect.value, title);
      titleInput.value = '';
    });

    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });
  }

  #addCard(columnId, title) {
    this.state.update(prev => ({
      columns: prev.columns.map(col =>
        col.id === columnId
          ? { ...col, cards: [...col.cards, { id: uid(), title, desc: '' }] }
          : col
      ),
    }));
  }

  #moveCard(cardId, fromColumnId, toColumnId) {
    if (fromColumnId === toColumnId) return;
    this.state.update(prev => {
      let card;
      const columns = prev.columns.map(col => {
        if (col.id === fromColumnId) {
          card = col.cards.find(c => c.id === cardId);
          return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
        }
        return col;
      });
      return {
        columns: columns.map(col =>
          col.id === toColumnId ? { ...col, cards: [...col.cards, card] } : col
        ),
      };
    });
  }

  #deleteCard(cardId, columnId) {
    this.state.update(prev => ({
      columns: prev.columns.map(col =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter(c => c.id !== cardId) }
          : col
      ),
    }));
  }

  #selectCard(card) {
    this.state.update({ selectedCard: card });
  }
}

customElements.define('kanban-app', KanbanApp);
