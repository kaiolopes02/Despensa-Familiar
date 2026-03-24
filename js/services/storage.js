/**
 * Serviço de Armazenamento
 * Abstração do localStorage com tratamento de erros
 */

import { CONFIG } from '../core/config.js';

export const StorageService = {
    get: (key, defaultValue = []) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.warn(`[Storage] Erro ao ler ${key}:`, error);
            return defaultValue;
        }
    },

    set: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn(`[Storage] Erro ao salvar ${key}:`, error);
            return false;
        }
    },

    loadItems: () => StorageService.get(CONFIG.STORAGE.ITEMS_KEY, []),
    saveItems: (items) => StorageService.set(CONFIG.STORAGE.ITEMS_KEY, items),
    loadHistory: () => StorageService.get(CONFIG.STORAGE.HISTORY_KEY, []),
    saveHistory: (history) => StorageService.set(CONFIG.STORAGE.HISTORY_KEY, history)
};

export default StorageService;