/**
 * Utilitários Puros (Pure Functions)
 * Sem efeitos colaterais, testáveis isoladamente
 */

import { CONFIG } from './config.js';

export const Utils = {
    generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9),

    escapeHtml: (text) => {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatDate: (date = new Date()) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    },

    isEmpty: (str) => !str || typeof str !== 'string' || str.trim().length === 0,

    getCategoryColor: (category) => {
        const colors = {
            'Alimentos': { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
            'Limpeza': { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
            'Higiene': { bg: '#ede9fe', text: '#5b21b6', dot: '#8b5cf6' },
            'Outros': { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' }
        };
        return colors[category] || colors['Outros'];
    },

    calculateStats: (items) => {
        return items.reduce((acc, item) => {
            const qty = parseInt(item.quantity) || 1;
            if (item.checked) acc.checked += qty;
            else acc.pending += qty;
            acc.total++;
            return acc;
        }, { pending: 0, checked: 0, total: 0 });
    },

    validateItem: (name, quantity) => {
        const errors = [];
        if (Utils.isEmpty(name)) errors.push('Nome é obrigatório');
        if (name.length > CONFIG.VALIDATION.MAX_ITEM_NAME_LENGTH) {
            errors.push(`Nome muito longo (máx: ${CONFIG.VALIDATION.MAX_ITEM_NAME_LENGTH})`);
        }
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < CONFIG.VALIDATION.MIN_QUANTITY || qty > CONFIG.VALIDATION.MAX_QUANTITY) {
            errors.push(`Quantidade inválida (${CONFIG.VALIDATION.MIN_QUANTITY}-${CONFIG.VALIDATION.MAX_QUANTITY})`);
        }
        return { valid: errors.length === 0, errors };
    }
};

export default Utils;