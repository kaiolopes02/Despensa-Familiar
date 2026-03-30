/* ============================================================
   STATE MANAGER — Gerenciamento reativo de estado global
   Baseado em pub/sub simples, sem dependências externas
   ============================================================ */

export class StateManager {
  constructor() {
    this._state = {
      items:       [],
      filter:      'all',
      searchQuery: '',
      isEditing:   false,
      editId:      null,
    };

    // Map de listeners por chave específica
    this._keyListeners = new Map();
    // Listeners globais (qualquer mudança)
    this._globalListeners = [];
  }

  /** Atualiza o estado e notifica os listeners relevantes */
  setState(updates) {
    const prevState = { ...this._state };
    this._state = { ...this._state, ...updates };

    // Notifica listeners globais
    this._globalListeners.forEach(cb => cb(this._state, prevState));

    // Notifica listeners de chaves específicas modificadas
    Object.keys(updates).forEach(key => {
      if (this._keyListeners.has(key)) {
        this._keyListeners.get(key).forEach(cb =>
          cb(this._state[key], prevState[key])
        );
      }
    });
  }

  /** Snapshot imutável do estado atual */
  get state() {
    return { ...this._state };
  }

  /** Itens ordenados do mais recente para o mais antigo */
  get items() {
    return [...this._state.items].sort((a, b) => b.createdAt - a.createdAt);
  }

  /** Itens filtrados por categoria e busca */
  get filteredItems() {
    let items = this.items;

    if (this._state.filter !== 'all') {
      items = items.filter(i => i.category === this._state.filter);
    }

    if (this._state.searchQuery) {
      const normalize = str =>
        str.toLowerCase()
           .normalize('NFD')
           .replace(/[\u0300-\u036f]/g, '');

      const q = normalize(this._state.searchQuery);
      items = items.filter(i => normalize(i.name).includes(q));
    }

    return items;
  }

  /** Estatísticas rápidas */
  get stats() {
    return this._state.items.reduce(
      (acc, item) => {
        acc.total++;
        item.checked ? acc.completed++ : acc.pending++;
        return acc;
      },
      { total: 0, pending: 0, completed: 0 }
    );
  }

  /**
   * Escuta qualquer mudança de estado.
   * @returns função de cancelamento (unsubscribe)
   */
  subscribe(callback) {
    this._globalListeners.push(callback);
    return () => {
      this._globalListeners = this._globalListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Escuta mudanças em uma chave específica do estado.
   * @returns função de cancelamento (unsubscribe)
   */
  subscribeTo(key, callback) {
    if (!this._keyListeners.has(key)) {
      this._keyListeners.set(key, []);
    }
    this._keyListeners.get(key).push(callback);

    return () => {
      const arr = this._keyListeners.get(key) || [];
      this._keyListeners.set(key, arr.filter(cb => cb !== callback));
    };
  }
}

// Singleton — compartilhado por toda a aplicação
export const state = new StateManager();