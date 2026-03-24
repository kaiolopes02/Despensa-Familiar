/**
 * Configurações Globais da Aplicação
 * Centraliza todas as constantes e configurações
 */

export const CONFIG = Object.freeze({
    STORAGE: {
        ITEMS_KEY: 'despensa_items_v4',
        HISTORY_KEY: 'despensa_history_v2',
        MAX_HISTORY_ENTRIES: 5
    },
    CATEGORIES: Object.freeze(['Alimentos', 'Limpeza', 'Higiene', 'Outros']),
    FILTERS: Object.freeze(['todos', 'Alimentos', 'Limpeza', 'Higiene', 'Outros']),
    TOAST: {
        DURATION: 3000,
        TYPES: Object.freeze({
            SUCCESS: 'success',
            WARNING: 'warning',
            ERROR: 'error',
            INFO: 'info'
        })
    },
    VALIDATION: {
        MAX_ITEM_NAME_LENGTH: 100,
        MIN_QUANTITY: 1,
        MAX_QUANTITY: 999
    }
});

export default CONFIG;