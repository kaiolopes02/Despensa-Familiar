/* ============================================================
   STORAGE SERVICE — Abstração do localStorage
   ============================================================ */

import { CONFIG } from '../core/Config.js';

export class StorageService {
  constructor() {
    this._storage = typeof localStorage !== 'undefined' ? localStorage : null;
  }

  get(key, defaultValue = null) {
    try {
      const raw = this._storage?.getItem(key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      this._storage?.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  remove(key) {
    try {
      this._storage?.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  /** Carrega os itens salvos */
  load() {
    return this.get(CONFIG.STORAGE.ITEMS_KEY, []);
  }

  /** Persiste os itens */
  save(items) {
    return this.set(CONFIG.STORAGE.ITEMS_KEY, items);
  }
}