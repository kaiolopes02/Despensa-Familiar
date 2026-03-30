/* ============================================================
   CONFIG — Configurações centralizadas da aplicação
   Edite aqui para adicionar categorias, ajustar limites, etc.
   ============================================================ */

export const CONFIG = Object.freeze({
  STORAGE: {
    ITEMS_KEY:   'despensa_items_v5',
    HISTORY_KEY: 'despensa_history_v3',
    THEME_KEY:   'despensa_theme',
    MAX_HISTORY: 10,
    MAX_URL_LENGTH: 1800,
  },
  VALIDATION: {
    MAX_NAME_LENGTH: 100,
    MIN_QTY: 1,
    MAX_QTY: 999,
    DEBOUNCE_MS: 250,
  },
  // Para adicionar uma categoria: copie um objeto abaixo e personalize
  CATEGORIES: [
    { id: 'Alimentos', icon: '🍎', color: '#92400e', bg: '#fef3c7' },
    { id: 'Limpeza',   icon: '🧼', color: '#1e40af', bg: '#dbeafe' },
    { id: 'Higiene',   icon: '🪥', color: '#5b21b6', bg: '#ede9fe' },
    { id: 'Outros',    icon: '📦', color: '#374151', bg: '#f3f4f6' },
  ],
});