/**
 * Gerenciamento de Estado da Aplicação
 * Padrão: Singleton com estado imutável
 */

import { CONFIG } from './config.js';

class AppState {
    constructor() {
        if (AppState.instance) return AppState.instance;
        
        this._state = {
            items: [],
            filter: CONFIG.FILTERS[0],
            editId: null,
            isLoading: false
        };
        
        this._listeners = new Set();
        AppState.instance = this;
    }

    get state() { return { ...this._state }; }
    get items() { return [...this._state.items]; }
    get filter() { return this._state.filter; }
    get editId() { return this._state.editId; }

    setState(updates) {
        const previousState = { ...this._state };
        this._state = { ...this._state, ...updates };
        this._notifyListeners(previousState);
    }

    subscribe(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    _notifyListeners(previousState) {
        this._listeners.forEach(listener => listener(this._state, previousState));
    }

    reset() {
        this._state = { items: [], filter: CONFIG.FILTERS[0], editId: null, isLoading: false };
        this._notifyListeners({});
    }
}

export const state = new AppState();
export default state;