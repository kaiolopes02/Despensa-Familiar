/* ============================================================
   APP — Orquestrador principal da aplicação Despensa Familiar
   Inicializa componentes, conecta serviços e gerencia estado global
   ============================================================ */

import { state }              from './core/StateManager.js';
import { Utils }              from './core/Utils.js';
import { StorageService }     from './services/StorageService.js';
import { CompressionService } from './services/CompressionService.js';
import { ShareService }       from './services/ShareService.js';
import { ToastManager }       from './components/ToastManager.js';
import { FormComponent }      from './components/FormComponent.js';
import { ListComponent }      from './components/ListComponent.js';
import { HistoryModal }       from './components/HistoryModal.js';

class App {
  constructor() {
    // Serviços (sem dependência de DOM)
    this._storage = new StorageService();
    this._toast   = new ToastManager();
    this._share   = new ShareService(state, this._toast);

    // Componentes (dependem de DOM — criados após DOMContentLoaded)
    this._history = new HistoryModal(state, this._toast);
    this._form    = new FormComponent(state, this._toast);
    this._list    = new ListComponent('itemsList', state, this._toast);
  }

  init() {
    this._loadTheme();
    this._loadData();
    this._subscribeToState();
    this._setupGlobalEvents();
    this._checkUrlImport();
    this._registerServiceWorker();
    this._updateHistoryBadge();
  }

  // ── Tema ─────────────────────────────────────────────────

  _loadTheme() {
    const saved       = localStorage.getItem('despensa_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme       = saved ?? (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    this._updateThemeIcon(theme);
  }

  _updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle .theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // ── Dados ─────────────────────────────────────────────────

  _loadData() {
    const items = this._storage.load();
    // Carrega sem disparar listeners (estado inicial)
    state.setState({ items });
  }

  // ── Estado reativo ────────────────────────────────────────

  /**
   * Centraliza reações globais a mudanças de estado:
   * - Auto-save no localStorage
   * - Atualização de stats
   * - Barra de progresso
   */
  _subscribeToState() {
    state.subscribe((newState) => {
      // 1. Persiste automaticamente
      this._storage.save(newState.items);

      // 2. Atualiza contadores
      this._renderStats(state.stats);

      // 3. Atualiza progresso
      this._updateProgress(newState.items);
    });
  }

  _renderStats({ pending, completed, total }) {
    this._animateCount('statPending',   pending);
    this._animateCount('statCompleted', completed);
    this._animateCount('statTotal',     total);
  }

  _animateCount(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = parseInt(el.textContent) || 0;
    if (prev === value) return;

    el.textContent = value;
    el.classList.remove('pop');
    // Força reflow para re-disparar animação
    void el.offsetWidth;
    el.classList.add('pop');
  }

  _updateProgress(items) {
    const container = document.getElementById('progressContainer');
    const fill      = document.getElementById('progressFill');
    const label     = document.getElementById('progressLabel');
    const total     = items.length;

    if (!container) return;

    if (total === 0) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    const done = items.filter(i => i.checked).length;
    const pct  = Math.round((done / total) * 100);

    if (fill)  fill.style.width = `${pct}%`;
    if (label) label.textContent = `${pct}% — ${done}/${total}`;

    // 🎉 Celebra quando tudo estiver comprado
    if (pct === 100 && done > 0) {
      this._celebrate();
    }
  }

  _celebrate() {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // Evita celebrações repetidas
    if (container.querySelector('.toast-celebrate')) return;

    const el = document.createElement('div');
    el.className   = 'toast-celebrate';
    el.textContent = '🎉 Tudo comprado! Ótima compra!';
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  // ── Eventos globais ───────────────────────────────────────

  _setupGlobalEvents() {
    // Tema
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next    = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('despensa_theme', next);
      this._updateThemeIcon(next);
    });

    // Histórico — abrir modal
    document.getElementById('historyBtn')?.addEventListener('click', () => {
      this._history.open();
    });

    // Compartilhar (pendentes)
    document.getElementById('shareBtn')?.addEventListener('click', () => {
      this._share.share();
    });

    // Salvar no histórico
    document.getElementById('saveHistoryBtn')?.addEventListener('click', () => {
      this._history.saveCurrentList();
      this._updateHistoryBadge();
    });

    // Limpar lista
    document.getElementById('clearBtn')?.addEventListener('click', () => {
      if (state.state.items.length === 0) return;
      if (confirm('Limpar toda a lista? Esta ação não pode ser desfeita.')) {
        state.setState({ items: [] });
        this._toast.success('Lista limpa!');
      }
    });

    // Atualiza badge quando o histórico muda
    document.addEventListener('history-changed', () => {
      this._updateHistoryBadge();
    });
  }

  _updateHistoryBadge() {
    const count = JSON.parse(localStorage.getItem('despensa_history_v3') || '[]').length;
    const badge = document.querySelector('#historyBtn .badge');
    if (!badge) return;
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }

  // ── Importação via URL ────────────────────────────────────

  _checkUrlImport() {
    const params     = new URLSearchParams(window.location.search);
    const compressed = params.get('d');
    if (!compressed) return;

    const data = CompressionService.decompressFromURL(compressed);
    if (!data?.items) {
      this._toast.error('Link inválido ou expirado');
      return;
    }

    const items = data.items.map(i => ({
      id:        Utils.generateId(),
      name:      i.n,
      category:  i.c,
      quantity:  i.q,
      checked:   false,
      createdAt: Date.now(),
    }));

    if (confirm(`Importar lista compartilhada com ${items.length} ${items.length === 1 ? 'item' : 'itens'}?`)) {
      state.setState({ items });
      window.history.replaceState({}, document.title, window.location.pathname);
      this._toast.success(`${items.length} ${items.length === 1 ? 'item importado' : 'itens importados'}!`);
    }
  }

  // ── Service Worker (PWA) ──────────────────────────────────

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW pode falhar em dev/localhost — não é crítico
      });
    }
  }
}

// ── Bootstrap ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});