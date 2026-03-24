/**
 * Renderizador de Componentes UI
 */

import { CONFIG } from '../core/config.js';
import { Utils } from '../core/utils.js';
import { HistoryService } from '../services/history.js';

export const Renderer = {
    renderItems: (items, filter = 'todos') => {
        const list = document.getElementById('lista');
        const emptyState = document.getElementById('empty-state');
        const listHeader = document.getElementById('list-header');

        if (!list) return;

        const filtered = filter === 'todos' ? items : items.filter(item => item.category === filter);

        emptyState?.classList.toggle('hidden', filtered.length > 0);
        emptyState?.setAttribute('aria-hidden', filtered.length > 0);
        listHeader?.classList.toggle('hidden', items.length === 0);

        list.innerHTML = '';
        filtered.forEach(item => {
            const li = Renderer._createItemElement(item);
            list.appendChild(li);
        });

        Renderer._updateCounters(items);
        Renderer._refreshIcons();
    },

    _createItemElement: (item) => {
        const li = document.createElement('li');
        li.className = `item-card ${item.checked ? 'checked' : ''}`;
        li.dataset.id = item.id;

        const colors = Utils.getCategoryColor(item.category);

        li.innerHTML = `
            <div class="check-circle" role="checkbox" aria-checked="${item.checked}" tabindex="0">
                <i data-lucide="check"></i>
            </div>
            <div class="cat-dot" style="background:${colors.dot}" title="${item.category}"></div>
            <div class="item-info">
                <span class="item-name">${Utils.escapeHtml(item.name)}</span>
                <div class="item-details">
                    <span class="cat-chip" style="background:${colors.bg};color:${colors.text}">${item.category}</span>
                    <span class="qty-badge">Qtd: ${item.quantity}</span>
                </div>
            </div>
            <div class="actions">
                <button class="btn-action edit" aria-label="Editar">
                    <i data-lucide="pencil"></i>
                </button>
                <button class="btn-action del" aria-label="Excluir">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;

        return li;
    },

    _updateCounters: (items) => {
        const stats = Utils.calculateStats(items);
        const pendingEl = document.getElementById('total-count');
        const checkedEl = document.getElementById('checked-count');
        const totalEl = document.getElementById('total-items');

        if (pendingEl) pendingEl.innerText = stats.pending;
        if (checkedEl) checkedEl.innerText = stats.checked;
        if (totalEl) totalEl.innerText = stats.total;
    },

    renderHistory: () => {
        const container = document.getElementById('history-list');
        const emptyEl = document.getElementById('history-empty');
        const history = HistoryService.getAll();

        if (!container) return;

        container.innerHTML = '';

        if (history.length === 0) {
            emptyEl?.classList.remove('hidden');
            container.classList.add('hidden');
            return;
        }

        emptyEl?.classList.add('hidden');
        container.classList.remove('hidden');

        history.forEach((entry, idx) => {
            const card = Renderer._createHistoryCard(entry, idx);
            container.appendChild(card);
        });

        Renderer._refreshIcons();
    },

    _createHistoryCard: (entry, index) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.style.animationDelay = `${index * 50}ms`;

        const chips = entry.items.map(i => `<span class="preview-chip">${Utils.escapeHtml(i.name)}</span>`).join('');

        card.innerHTML = `
            <div class="history-card-top">
                <div class="history-entry-label">
                    <div class="history-index">${index + 1}</div>
                    <span class="history-date">${entry.date}</span>
                </div>
                <span class="history-item-count">${entry.items.length} itens</span>
            </div>
            <div class="history-card-body"><div class="history-items-preview">${chips}</div></div>
            <div class="history-card-footer">
                <button class="btn-use-history" data-id="${entry.id}">
                    <i data-lucide="copy-plus"></i> Usar como base
                </button>
                <button class="btn-del-history" data-id="${entry.id}" aria-label="Remover">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;

        return card;
    },

    resetForm: () => {
        const nameInput = document.getElementById('itemName');
        const qtyInput = document.getElementById('itemQuantity');
        const catSelect = document.getElementById('itemCategory');
        const editIdInput = document.getElementById('editId');
        const addBtn = document.getElementById('addBtn');

        if (nameInput) nameInput.value = '';
        if (qtyInput) qtyInput.value = '1';
        if (catSelect) catSelect.value = CONFIG.CATEGORIES[0];
        if (editIdInput) editIdInput.value = '';

        if (addBtn) {
            addBtn.innerHTML = '<i data-lucide="plus-circle"></i><span>Adicionar à Lista</span>';
            addBtn.classList.remove('editing');
        }

        Renderer._refreshIcons();
        if (nameInput) nameInput.focus();
    },

    setEditMode: (item) => {
        const nameInput = document.getElementById('itemName');
        const qtyInput = document.getElementById('itemQuantity');
        const catSelect = document.getElementById('itemCategory');
        const editIdInput = document.getElementById('editId');
        const addBtn = document.getElementById('addBtn');

        if (nameInput) nameInput.value = item.name;
        if (qtyInput) qtyInput.value = item.quantity;
        if (catSelect) catSelect.value = item.category;
        if (editIdInput) editIdInput.value = item.id;

        if (addBtn) {
            addBtn.innerHTML = '<i data-lucide="save"></i><span>Salvar Alterações</span>';
            addBtn.classList.add('editing');
        }

        Renderer._refreshIcons();
        if (nameInput) {
            nameInput.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    _refreshIcons: () => { if (window.lucide) window.lucide.createIcons(); }
};

export default Renderer;