/* ============================================================
   HISTORY MODAL — Modal de histórico de listas
   Usa delegação de eventos — sem inline onclick
   ============================================================ */

import { Utils }  from '../core/Utils.js';
import { CONFIG } from '../core/Config.js';

export class HistoryModal {
  constructor(stateManager, toastManager) {
    this.state = stateManager;
    this.toast = toastManager;
    this._modal = document.getElementById('historyModal');
    this._list  = document.getElementById('historyList');
    this._init();
  }

  _init() {
    // Fechar modal com o botão ✕
    this._modal?.querySelector('.close-modal')?.addEventListener('click', () => this.close());

    // Fechar clicando no backdrop
    this._modal?.addEventListener('click', (e) => {
      if (e.target === this._modal) this.close();
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this._modal?.classList.contains('hidden')) {
        this.close();
      }
    });

    // ✅ Delegação de eventos — sem onclick inline no HTML
    this._list?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'restore') this._restore(id);
      if (action === 'delete')  this._deleteEntry(id);
    });
  }

  open() {
    this._render();
    this._modal?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Foco acessível no modal
    setTimeout(() => {
      this._modal?.querySelector('.close-modal')?.focus();
    }, 100);
  }

  close() {
    this._modal?.classList.add('hidden');
    document.body.style.overflow = '';
  }

  _getHistory() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.STORAGE.HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  }

  _saveHistory(history) {
    localStorage.setItem(CONFIG.STORAGE.HISTORY_KEY, JSON.stringify(history));
    // Notifica o app para atualizar o badge
    document.dispatchEvent(new CustomEvent('history-changed'));
  }

  /** Salva a lista atual no histórico e a limpa */
  saveCurrentList() {
    const items = this.state.state.items;
    if (items.length === 0) {
      this.toast.warning('A lista está vazia, nada para salvar!');
      return;
    }

    const history = this._getHistory();
    const entry = {
      id:    Utils.generateId(),
      date:  Utils.formatDate(new Date()),
      items: [...items],
    };

    history.unshift(entry);
    if (history.length > CONFIG.STORAGE.MAX_HISTORY) history.pop();

    this._saveHistory(history);
    this.state.setState({ items: [] });
    this.toast.success(`Lista salva! (${entry.items.length} itens)`);
  }

  _render() {
    const history = this._getHistory();
    const empty   = document.getElementById('emptyHistory');

    if (history.length === 0) {
      if (this._list) this._list.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }

    empty?.classList.add('hidden');

    this._list.innerHTML = history.map((h, i) => `
      <div class="history-card" role="listitem" style="animation-delay:${i * 45}ms">
        <div class="history-card-header">
          <div class="history-meta">
            <span class="history-number">Lista #${i + 1}</span>
            <span class="history-date">${h.date}</span>
          </div>
          <span class="history-count">${h.items.length} ${h.items.length === 1 ? 'item' : 'itens'}</span>
        </div>

        <div class="history-preview">
          ${h.items.slice(0, 4).map(it =>
            `<span class="preview-tag">${Utils.escapeHtml(it.name)}</span>`
          ).join('')}
          ${h.items.length > 4
            ? `<span class="preview-tag preview-more">+${h.items.length - 4} mais</span>`
            : ''}
        </div>

        <div class="history-actions">
          <button class="btn btn-sm btn-primary"
                  data-action="restore"
                  data-id="${h.id}"
                  aria-label="Restaurar lista #${i + 1}">
            ↩ Restaurar
          </button>
          <button class="btn btn-sm btn-danger-ghost"
                  data-action="delete"
                  data-id="${h.id}"
                  aria-label="Excluir entrada #${i + 1}">
            🗑️
          </button>
        </div>
      </div>
    `).join('');
  }

  _restore(id) {
    const history = this._getHistory();
    const entry   = history.find(h => h.id === id);
    if (!entry) return;

    const hasCurrentItems = this.state.state.items.length > 0;
    if (hasCurrentItems && !confirm('Substituir a lista atual pela lista salva?')) return;

    const items = entry.items.map(i => ({
      ...i,
      id:        Utils.generateId(),
      checked:   false,
      createdAt: Date.now(),
    }));

    this.state.setState({ items });
    this.close();
    this.toast.success(`Lista restaurada! (${items.length} itens)`);
  }

  _deleteEntry(id) {
    if (!confirm('Excluir esta lista do histórico?')) return;
    const history = this._getHistory().filter(h => h.id !== id);
    this._saveHistory(history);
    this._render();

    const empty = document.getElementById('emptyHistory');
    if (history.length === 0) empty?.classList.remove('hidden');
  }
}