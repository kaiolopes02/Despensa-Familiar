/**
 * Serviço de Histórico
 */

import { CONFIG } from '../core/config.js';
import { StorageService } from './storage.js';
import { Utils } from '../core/utils.js';

export const HistoryService = {
    saveToHistory: (items) => {
        if (!items || items.length === 0) {
            return { success: false, message: 'Lista vazia' };
        }

        const history = StorageService.loadHistory();
        const entry = {
            id: Utils.generateId(),
            date: Utils.formatDate(new Date()),
            items: JSON.parse(JSON.stringify(items)),
            createdAt: Date.now()
        };

        history.unshift(entry);
        if (history.length > CONFIG.STORAGE.MAX_HISTORY_ENTRIES) {
            history.length = CONFIG.STORAGE.MAX_HISTORY_ENTRIES;
        }

        StorageService.saveHistory(history);
        return { success: true, message: 'Lista salva no histórico' };
    },

    loadFromHistory: (entryId) => {
        const history = StorageService.loadHistory();
        const entry = history.find(h => h.id === entryId);
        
        if (!entry) return { success: false, items: [] };

        const items = entry.items.map(item => ({
            ...item,
            id: Utils.generateId(),
            checked: false
        }));

        return { success: true, items };
    },

    deleteEntry: (entryId) => {
        let history = StorageService.loadHistory();
        history = history.filter(h => h.id !== entryId);
        StorageService.saveHistory(history);
        return { success: true };
    },

    hasHistory: () => StorageService.loadHistory().length > 0,
    getAll: () => StorageService.loadHistory()
};

export default HistoryService;