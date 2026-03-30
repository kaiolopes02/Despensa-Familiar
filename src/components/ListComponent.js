/* ============================================================
   LIST COMPONENT — Renderização e interação com a lista
   ============================================================ */

import { Utils }  from '../core/Utils.js';
import { CONFIG } from '../core/Config.js';

export class ListComponent {
  constructor(containerId, stateManager, toastManager) {
    this._container = document.getElementById(containerId);
    this.state      = stateManager;
    this.toast      = toastManager;

    if (!this._container) {
      console.error(`[ListComponent] Container #${containerId} não encontrado`);
      return;
    }
    this._init();
  }

  _init() {
    // Reage a mudanças relevantes no estado
    this.state.subscribeTo('items',       () => this.render());
    this.state.subscribeTo('filter',      () => this.render());
    this.state.subscribeTo('searchQuery', () => this.render());

    // Event delegation — um único listener para toda a lista
    this._container.addEventListener('click', (e) => this._handleClick(e));
  }

  render() {
    const filtered = this.state.filteredItems;
    const allItems = this.state.state.items;
    const hasAny   = allItems.length > 0;
    const hasFiltered = filtered.length > 0;

    // Mostrar/ocultar header de ações
    const listHeader = document.getElementById('listHeader');
    if (listHeader) listHeader.classList.toggle('hidden', !hasAny);

    // Mensagem do estado vazio
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.style.display = hasFiltered ? 'none' : '';
      if (!hasFiltered) {
        const title    = document.getElementById('emptyTitle');
        const subtitle = document.getElementById('emptySubtitle');
        if (hasAny) {
          // Há itens, mas foram filtrados/buscados
          if (title)    title.textContent    = 'Nenhum resultado';
          if (subtitle) subtitle.textContent = 'Tente uma busca diferente ou outro filtro';
        } else {
          if (title)    title.textContent    = 'Lista vazia';
          if (subtitle) subtitle.textContent = 'Adicione itens acima para começar sua lista';
        }
      }
    }

    if (!hasFiltered) {
      this._container.innerHTML = '';
      return;
    }

    // Renderiza com DocumentFragment para performance
    const fragment = document.createDocumentFragment();
    filtered.forEach((item, idx) => {
      fragment.appendChild(this._createCard(item, idx));
    });

    this._container.innerHTML = '';
    this._container.appendChild(fragment);
  }

  _createCard(item, index) {
    const cat = CONFIG.CATEGORIES.find(c => c.id === item.category)
             ?? CONFIG.CATEGORIES[CONFIG.CATEGORIES.length - 1];

    const li = document.createElement('li');
    li.className = `item-card${item.checked ? ' checked' : ''}`;
    li.dataset.id = item.id;
    // Limita o delay máximo para não demorar demais em listas grandes
    li.style.animationDelay = `${Math.min(index * 35, 300)}ms`;
    li.setAttribute('role', 'listitem');

    li.innerHTML = `
      <button
        class="checkbox"
        type="button"
        aria-label="${item.checked ? 'Desmarcar item' : 'Marcar como comprado'}"
        aria-pressed="${item.checked}"
      >${item.checked ? '✓' : ''}</button>

      <div class="item-content" role="button" tabindex="0"
           aria-label="Clique para ${item.checked ? 'desmarcar' : 'marcar'} ${Utils.escapeHtml(item.name)}">
        <div class="item-main">
          <span class="item-name">${Utils.escapeHtml(item.name)}</span>
          <span class="item-quantity">×${item.quantity}</span>
        </div>
        <span class="category-badge"
              style="background:${cat.bg};color:${cat.color}">
          ${cat.icon} ${item.category}
        </span>
      </div>

      <div class="item-actions" role="group" aria-label="Ações do item">
        <button class="btn-action edit" type="button"
                aria-label="Editar ${Utils.escapeHtml(item.name)}"
                title="Editar">✏️</button>
        <button class="btn-action delete" type="button"
                aria-label="Excluir ${Utils.escapeHtml(item.name)}"
                title="Excluir">🗑️</button>
      </div>
    `;

    // Suporte a teclado no item-content
    const content = li.querySelector('.item-content');
    content?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._toggleItem(item.id, li);
      }
    });

    return li;
  }

  _handleClick(e) {
    const card = e.target.closest('.item-card');
    if (!card) return;
    const id = card.dataset.id;
    if (!id) return;

    if (e.target.closest('.checkbox') || e.target.closest('.item-content')) {
      this._toggleItem(id, card);
    } else if (e.target.closest('.edit')) {
      this._editItem(id);
    } else if (e.target.closest('.delete')) {
      this._deleteItem(id, card);
    }
  }

  _toggleItem(id, card) {
    const item = this.state.state.items.find(i => i.id === id);
    if (!item) return;

    // Feedback visual imediato antes do re-render
    card?.classList.toggle('checked');
    const checkbox = card?.querySelector('.checkbox');
    if (checkbox) {
      const willCheck = !item.checked;
      checkbox.textContent = willCheck ? '✓' : '';
      checkbox.setAttribute('aria-pressed', String(willCheck));
    }

    const items = this.state.state.items.map(i =>
      i.id === id ? { ...i, checked: !i.checked } : i
    );
    this.state.setState({ items });
  }

  _editItem(id) {
    const item = this.state.state.items.find(i => i.id === id);
    if (!item) return;
    document.dispatchEvent(new CustomEvent('edit-item', { detail: item, bubbles: true }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  _deleteItem(id, card) {
    // Animação de saída suave
    if (card) {
      card.classList.add('removing');
      card.addEventListener('animationend', () => {
        const items = this.state.state.items.filter(i => i.id !== id);
        this.state.setState({ items });
      }, { once: true });
      // Fallback se animationend não disparar
      setTimeout(() => {
        if (card.isConnected) {
          const items = this.state.state.items.filter(i => i.id !== id);
          this.state.setState({ items });
        }
      }, 350);
    } else {
      const items = this.state.state.items.filter(i => i.id !== id);
      this.state.setState({ items });
    }
  }
}