/**
 * Ações de Itens (CRUD)
 */

import { state } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { StorageService } from '../services/storage.js';
import { ToastService } from '../ui/toast.js';
import { Renderer } from '../ui/renderer.js';

export const ItemActions = {
    save: (name, category, quantity, editId = null) => {
        const validation = Utils.validateItem(name, quantity);
        if (!validation.valid) {
            ToastService.warning(validation.errors[0]);
            return false;
        }

        const items = state.items;
        const exists = items.some(item => item.name.toLowerCase() === name.toLowerCase() && item.id !== editId);

        if (exists) {
            ToastService.warning('Este item já está na lista!');
            return false;
        }

        if (editId) {
            const updatedItems = items.map(item => 
                item.id === editId ? { ...item, name, category, quantity } : item
            );
            state.setState({ items: updatedItems });
            ToastService.success(`"${name}" atualizado!`);
        } else {
            const newItem = {
                id: Utils.generateId(),
                name,
                category,
                quantity: Math.max(1, parseInt(quantity) || 1),
                checked: false
            };
            state.setState({ items: [...items, newItem] });
            ToastService.success(`"${name}" adicionado!`);
        }

        StorageService.saveItems(state.items);
        Renderer.renderItems(state.items, state.filter);
        return true;
    },

    toggle: (itemId) => {
        const items = state.items.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        state.setState({ items });
        StorageService.saveItems(items);
        Renderer.renderItems(items, state.filter);
    },

    delete: (itemId) => {
        const item = state.items.find(i => i.id === itemId);
        const items = state.items.filter(i => i.id !== itemId);

        if (state.editId === itemId) {
            state.setState({ editId: null });
            Renderer.resetForm();
        }

        state.setState({ items });
        StorageService.saveItems(items);
        Renderer.renderItems(items, state.filter);

        if (item) ToastService.info(`"${item.name}" removido.`);
    },

    clearAll: () => {
        const items = state.items;
        if (items.length === 0) return;

        if (!confirm(`Remover todos os ${items.length} itens da lista?`)) return;

        state.setState({ items: [], editId: null });
        StorageService.saveItems([]);
        Renderer.renderItems([], state.filter);
        Renderer.resetForm();
        ToastService.success('Lista limpa!');
    },

    setFilter: (filter) => {
        state.setState({ filter });
        Renderer.renderItems(state.items, filter);
    }
};

export default ItemActions;