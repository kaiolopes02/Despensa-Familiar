/**
 * Entry Point da Aplicação
 * Inicializa e orquestra todos os módulos
 */

import { state } from './core/state.js';
import { StorageService } from './services/storage.js';
import { HistoryService } from './services/history.js';
import { Renderer } from './ui/renderer.js';
import { ToastService } from './ui/toast.js';
import { FormUI } from './ui/form.js';
import { ItemActions } from './actions/items.js';
import { ShareActions } from './actions/share.js';

/**
 * Inicializa event listeners
 */
const initEventListeners = () => {
    // Inicializa formulário
    FormUI.init();

    // Botão principal do form
    document.getElementById('addBtn')?.addEventListener('click', handleFormSubmit);

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            e.target.classList.add('active');
            e.target.setAttribute('aria-selected', 'true');
            ItemActions.setFilter(e.target.dataset.filter);
        });
    });

    // Lista de itens (Event Delegation)
    document.getElementById('lista')?.addEventListener('click', handleListClick);

    // Header actions
    document.getElementById('shareBtn')?.addEventListener('click', ShareActions.share);
    document.getElementById('clearAllBtn')?.addEventListener('click', ItemActions.clearAll);
    document.getElementById('saveHistoryBtn')?.addEventListener('click', handleSaveHistory);

    // History modal
    document.getElementById('historyBtn')?.addEventListener('click', openHistory);
    document.getElementById('closeHistoryBtn')?.addEventListener('click', closeHistory);
    document.getElementById('history-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'history-overlay') closeHistory();
    });

    // History actions (Event Delegation)
    document.getElementById('history-list')?.addEventListener('click', handleHistoryClick);

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('history-overlay');
            if (overlay && !overlay.classList.contains('hidden')) {
                closeHistory();
            }
        }
    });
};

/**
 * Handle form submit
 */
const handleFormSubmit = () => {
    const values = FormUI.getValues();
    const validation = FormUI.validate();

    if (!validation.valid) {
        ToastService.warning(validation.errors[0]);
        FormUI.focusName();
        return;
    }

    const success = ItemActions.save(
        values.name,
        values.category,
        values.quantity,
        values.editId || null
    );

    if (success) {
        FormUI.reset();
    }
};

/**
 * Handle list item clicks (delegation)
 */
const handleListClick = (e) => {
    const li = e.target.closest('.item-card');
    if (!li) return;

    const itemId = li.dataset.id;

    if (e.target.closest('.check-circle') || e.target.closest('.item-info')) {
        ItemActions.toggle(itemId);
    } else if (e.target.closest('.edit')) {
        const item = state.items.find(i => i.id === itemId);
        if (item) FormUI.setEditMode(item);
    } else if (e.target.closest('.del')) {
        ItemActions.delete(itemId);
    }
};

/**
 * Handle history modal clicks (delegation)
 */
const handleHistoryClick = (e) => {
    const btnUse = e.target.closest('.btn-use-history');
    const btnDel = e.target.closest('.btn-del-history');

    if (btnUse) {
        const result = HistoryService.loadFromHistory(btnUse.dataset.id);
        if (result.success) {
            if (state.items.length > 0 && !confirm('Substituir lista atual?')) return;
            state.setState({ items: result.items });
            StorageService.saveItems(result.items);
            Renderer.renderItems(result.items, state.filter);
            closeHistory();
            ToastService.success('Lista carregada!');
        }
    }

    if (btnDel) {
        HistoryService.deleteEntry(btnDel.dataset.id);
        Renderer.renderHistory();
        updateHistoryBadge();
        ToastService.info('Entrada removida.');
    }
};

/**
 * Save current list to history
 */
const handleSaveHistory = () => {
    const result = HistoryService.saveToHistory(state.items);

    if (result.success) {
        state.setState({ items: [] });
        StorageService.saveItems([]);
        Renderer.renderItems([], state.filter);
        FormUI.reset();
        updateHistoryBadge();
        ToastService.success(result.message);
    } else {
        ToastService.warning(result.message);
    }
};

/**
 * Open history modal
 */
const openHistory = () => {
    const overlay = document.getElementById('history-overlay');
    overlay?.classList.remove('hidden');
    overlay?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    Renderer.renderHistory();
};

/**
 * Close history modal
 */
const closeHistory = () => {
    const overlay = document.getElementById('history-overlay');
    overlay?.classList.add('hidden');
    overlay?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
};

/**
 * Update history badge
 */
const updateHistoryBadge = () => {
    const btn = document.getElementById('historyBtn');
    if (!btn) return;

    const hasHistory = HistoryService.hasHistory();
    btn.classList.toggle('has-history', hasHistory);

    // Remove existing badge
    const existingBadge = btn.querySelector('.badge');
    if (existingBadge) existingBadge.remove();

    // Add badge if has history
    if (hasHistory) {
        const dot = document.createElement('span');
        dot.className = 'badge';
        dot.style.cssText = 'position:absolute;top:8px;right:8px;width:9px;height:9px;background:var(--accent);border-radius:50%;border:2px solid var(--card);';
        btn.appendChild(dot);
    }
};

/**
 * Initialize application
 */
const init = () => {
    // Try import from URL
    const importedItems = ShareActions.importFromUrl();

    if (importedItems) {
        state.setState({ items: importedItems });
        StorageService.saveItems(importedItems);
        ToastService.success('Lista importada!');
    } else {
        // Load from storage
        const items = StorageService.loadItems();
        state.setState({ items });
    }

    // Initial render
    Renderer.renderItems(state.items, state.filter);
    updateHistoryBadge();

    // Init icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Init event listeners
    initEventListeners();

    console.log('[App] Despensa Familiar initialized');
};

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}