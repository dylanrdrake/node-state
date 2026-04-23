import { FlowState, FlowStateComponent } from 'flow-state';
import './kanban-card.js';

const HTML = String.raw;
const CSS = String.raw;

class KanbanColumn extends FlowStateComponent {
  shadowMode = 'open';

  styles = CSS`
    :host {
      display: flex;
      flex-direction: column;
      width: 272px;
      flex-shrink: 0;
      background: #1e293b;
      border-radius: 12px;
      border: 1px solid #334155;
      max-height: calc(100vh - 100px);
    }

    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px 10px;
      border-bottom: 1px solid #334155;
      flex-shrink: 0;
    }

    .column-title {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }

    .card-count {
      font-size: 12px;
      color: #475569;
      background: #0f172a;
      border-radius: 10px;
      padding: 1px 8px;
      font-variant-numeric: tabular-nums;
    }

    .cards-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
      overflow-y: auto;
      flex: 1;
    }

    .cards-list::-webkit-scrollbar { width: 4px; }
    .cards-list::-webkit-scrollbar-track { background: transparent; }
    .cards-list::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

    .empty {
      font-size: 12px;
      color: #475569;
      text-align: center;
      padding: 20px 0;
    }

    .move-form {
      display: flex;
      gap: 6px;
      padding: 8px 10px;
      border-top: 1px solid #334155;
      flex-shrink: 0;
    }

    .move-form select {
      flex: 1;
      padding: 5px 8px;
      border-radius: 6px;
      border: 1px solid #334155;
      background: #0f172a;
      color: #94a3b8;
      font: inherit;
      font-size: 12px;
    }

    .move-form button {
      padding: 5px 10px;
      border-radius: 6px;
      border: none;
      background: #334155;
      color: #e2e8f0;
      font: inherit;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }

    .move-form button:hover { background: #475569; }
  `;

  template = HTML`
    <div class="column-header">
      <span class="column-title" id="col-title"></span>
      <span class="card-count" id="card-count">0</span>
    </div>
    <div class="cards-list" id="cards-list"></div>
    <div class="move-form">
      <select id="move-target"></select>
      <button id="move-selected-btn">Move selected →</button>
    </div>
  `;

  // Local state: which card in this column is selected, and the full columns list
  // (needed to populate the move-target select and render cards).
  flowConfig = {
    init: {
      columnData: null,    // { id, title, cards[] } — set by parent watcher
      selectedCardId: null,
    },
    options: { label: 'KanbanColumn' },
  };

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();

    const columnId = this.dataset.columnId;
    const shadow = this.shadowRoot;
    const cardsList  = shadow.getElementById('cards-list');
    const colTitle   = shadow.getElementById('col-title');
    const cardCount  = shadow.getElementById('card-count');
    const moveTarget = shadow.getElementById('move-target');
    const moveBtn    = shadow.getElementById('move-selected-btn');

    // Get shared hooks from parent KanbanApp scope
    const moveCard   = FlowState.get(this, 'moveCard');
    const deleteCard = FlowState.get(this, 'deleteCard');
    const selectCard = FlowState.get(this, 'selectCard');

    // Watch the full columns list from the parent to extract this column's data
    // and keep the move-target selector up to date.
    FlowState.watch(this, 'columns', (columns) => {
      const col = columns?.find(c => c.id === columnId);
      if (!col) return;

      // Update local columnData so kanban-cards can watch it
      this.state.update({ columnData: col });

      // Sync move-target options (all other columns)
      const current = moveTarget.value;
      moveTarget.innerHTML = columns
        .filter(c => c.id !== columnId)
        .map(c => `<option value="${c.id}">${c.title}</option>`)
        .join('');
      if (current) moveTarget.value = current;

      // Update header
      colTitle.textContent  = col.title;
      cardCount.textContent = col.cards.length;

      // Sync kanban-card elements
      const existing = new Map(
        [...cardsList.querySelectorAll('kanban-card')].map(el => [Number(el.dataset.cardId), el])
      );

      // Remove cards no longer in this column
      for (const [id, el] of existing) {
        if (!col.cards.find(c => c.id === id)) el.remove();
      }

      if (col.cards.length === 0) {
        if (!cardsList.querySelector('.empty')) {
          cardsList.innerHTML = '<p class="empty">No cards</p>';
        }
      } else {
        const emptyEl = cardsList.querySelector('.empty');
        if (emptyEl) emptyEl.remove();

        col.cards.forEach((card, i) => {
          let el = existing.get(card.id);
          if (!el) {
            el = document.createElement('kanban-card');
            el.dataset.cardId = card.id;
            el.dataset.columnId = columnId;
            cardsList.appendChild(el);
          }
          if (cardsList.children[i] !== el) cardsList.insertBefore(el, cardsList.children[i]);
        });
      }
    });

    // Track which card is selected within this column via event from kanban-card
    shadow.addEventListener('kanban-card-select', (e) => {
      const { cardId } = e.detail;
      const current = this.state.get('selectedCardId');
      // Toggle off if already selected, otherwise select
      this.state.update({ selectedCardId: current === cardId ? null : cardId });
    });

    // Move selected card button
    moveBtn.addEventListener('click', () => {
      const selectedId = this.state.get('selectedCardId');
      if (selectedId === null) return;
      const targetColumnId = moveTarget.value;
      if (!targetColumnId) return;
      moveCard?.(selectedId, columnId, targetColumnId);
      this.state.update({ selectedCardId: null });
    });
  }
}

customElements.define('kanban-column', KanbanColumn);
